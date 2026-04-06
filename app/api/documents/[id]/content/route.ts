import { NextResponse } from "next/server";

import {
  KNOWLEDGE_BUCKET,
  MAX_DOCUMENT_BYTES,
  normalizeAllowedDocumentMime,
  sanitizeDisplayFilename,
} from "@/lib/documents-policy";
import { queueDocumentIngestion } from "@/lib/server/ingestion-jobs";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceSnapshot } from "@/lib/workspace";

async function getTextDocument(
  documentId: string,
  knowledgeBaseId: string,
) {
  const supabase = await createClient();
  const { data: doc, error } = await supabase
    .from("documents")
    .select("id, filename, mime_type, storage_path, size_bytes, organization_id")
    .eq("id", documentId)
    .eq("knowledge_base_id", knowledgeBaseId)
    .maybeSingle();
  if (error || !doc) {
    return { supabase, error: error?.message ?? "Document not found", doc: null };
  }
  if (normalizeAllowedDocumentMime(doc.mime_type) !== "text/plain") {
    return { supabase, error: "Only text/plain documents are editable.", doc: null };
  }
  return { supabase, error: null, doc };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const workspace = await getWorkspaceSnapshot();
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 403 });
  }

  const { supabase, error, doc } = await getTextDocument(
    id,
    workspace.knowledgeBase.id,
  );
  if (error || !doc) {
    return NextResponse.json({ error }, { status: 404 });
  }

  const { data, error: downloadError } = await supabase.storage
    .from(KNOWLEDGE_BUCKET)
    .download(doc.storage_path);
  if (downloadError || !data) {
    return NextResponse.json(
      { error: downloadError?.message ?? "Could not load content." },
      { status: 500 },
    );
  }

  const content = Buffer.from(await data.arrayBuffer()).toString("utf8");
  return NextResponse.json({ id: doc.id, filename: doc.filename, content });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const workspace = await getWorkspaceSnapshot();
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 403 });
  }
  const {
    profile: { id: userId },
  } = workspace;

  const { supabase, error, doc } = await getTextDocument(
    id,
    workspace.knowledgeBase.id,
  );
  if (error || !doc) {
    return NextResponse.json({ error }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    content?: string;
  };
  const content = String(body.content ?? "");
  if (!content.trim()) {
    return NextResponse.json(
      { error: "Content cannot be empty." },
      { status: 400 },
    );
  }
  const title = String(body.title ?? "").trim();
  const filename = title ? sanitizeDisplayFilename(`${title}.txt`) : doc.filename;
  const payload = Buffer.from(content, "utf8");

  if (payload.byteLength > MAX_DOCUMENT_BYTES) {
    return NextResponse.json(
      { error: "Text source too large." },
      { status: 400 },
    );
  }

  const { error: uploadError } = await supabase.storage
    .from(KNOWLEDGE_BUCKET)
    .upload(doc.storage_path, payload, {
      contentType: "text/plain",
      upsert: true,
    });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  await supabase.from("document_chunks").delete().eq("document_id", doc.id);
  const { error: updateError } = await supabase
    .from("documents")
    .update({
      filename,
      size_bytes: payload.byteLength,
      status: "pending",
      chunk_count: 0,
      error_message: null,
    })
    .eq("id", doc.id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  try {
    const queued = await queueDocumentIngestion(supabase, {
      organizationId: workspace.organization.id,
      knowledgeBaseId: workspace.knowledgeBase.id,
      createdBy: userId,
      documentId: doc.id,
      sizeBytes: payload.byteLength,
      jobType: "reindex",
    });
    return NextResponse.json({
      ok: true,
      job_id: queued.jobId,
      inline_error: queued.inlineError,
    });
  } catch (queueError) {
    const message =
      queueError instanceof Error
        ? queueError.message
        : "Could not queue reindex.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
