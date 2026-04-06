import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import {
  KNOWLEDGE_BUCKET,
  MAX_DOCUMENT_BYTES,
  sanitizeDisplayFilename,
  storageObjectBasename,
} from "@/lib/documents-policy";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { queueDocumentIngestion } from "@/lib/server/ingestion-jobs";
import { createClient } from "@/lib/supabase/server";
import { logUsageEvent } from "@/lib/server/usage-events";
import { getWorkspaceSnapshot } from "@/lib/workspace";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await getWorkspaceSnapshot();
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 403 });
  }
  const rate = await checkRateLimit({
    key: `text-source:${user.id}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many text source requests. Try again shortly." },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    content?: string;
  };
  const title = String(body.title ?? "").trim() || "Text source";
  const content = String(body.content ?? "");
  if (!content.trim()) {
    return NextResponse.json(
      { error: "Content is required." },
      { status: 400 },
    );
  }

  const filename = sanitizeDisplayFilename(`${title}.txt`);
  const objectBase = storageObjectBasename(filename);
  const docId = randomUUID();
  const storagePath = `${workspace.organization.id}/${workspace.knowledgeBase.id}/${docId}/${objectBase}`;
  const payload = Buffer.from(content, "utf8");

  if (payload.byteLength > MAX_DOCUMENT_BYTES) {
    return NextResponse.json(
      { error: "Text source too large." },
      { status: 400 },
    );
  }

  const { error: insertError } = await supabase.from("documents").insert({
    id: docId,
    knowledge_base_id: workspace.knowledgeBase.id,
    organization_id: workspace.organization.id,
    uploaded_by: user.id,
    storage_path: storagePath,
    filename,
    mime_type: "text/plain",
    size_bytes: payload.byteLength,
    status: "pending",
  });
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { error: uploadError } = await supabase.storage
    .from(KNOWLEDGE_BUCKET)
    .upload(storagePath, payload, {
      contentType: "text/plain",
      upsert: false,
    });
  if (uploadError) {
    await supabase.from("documents").delete().eq("id", docId);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }
  await logUsageEvent(supabase, {
    organizationId: workspace.organization.id,
    userId: workspace.profile.id,
    eventType: "text_source_created",
    metadata: { document_id: docId, bytes: payload.byteLength },
  });

  try {
    const queued = await queueDocumentIngestion(supabase, {
      organizationId: workspace.organization.id,
      knowledgeBaseId: workspace.knowledgeBase.id,
      createdBy: user.id,
      documentId: docId,
      sizeBytes: payload.byteLength,
      jobType: "file_ingest",
    });

    return NextResponse.json({
      id: docId,
      status: queued.inlineError ? "pending" : queued.mode === "inline" ? "ready" : "queued",
      job_id: queued.jobId,
      inline_error: queued.inlineError,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not queue ingestion job.";
    await supabase
      .from("documents")
      .update({ status: "failed", error_message: message })
      .eq("id", docId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
