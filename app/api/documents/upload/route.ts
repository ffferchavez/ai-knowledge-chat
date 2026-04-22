import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  KNOWLEDGE_BUCKET,
  MAX_DOCUMENT_BYTES,
  mimeFromFilename,
  normalizeAllowedDocumentMime,
  sanitizeDisplayFilename,
  storageObjectBasename,
} from "@/lib/documents-policy";
import {
  queueDocumentIngestion,
  shouldInlineIngest,
} from "@/lib/server/ingestion-jobs";
import { resolveFolderForKnowledgeBase } from "@/lib/server/knowledge-folders";
import { applyRateLimitHeaders, checkRateLimit } from "@/lib/server/rate-limit";
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
  const limitConfig = { limit: 8 };
  const rate = await checkRateLimit({
    key: `upload:${user.id}`,
    limit: limitConfig.limit,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json(
      { error: "Upload rate limit exceeded. Try again in a minute." },
      { status: 429 },
      ),
      rate,
      limitConfig,
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const rawFolderId = formData.get("folderId");
  const folderIdValue =
    typeof rawFolderId === "string" ? rawFolderId : null;
  let folderId: string | null = null;
  if (folderIdValue) {
    try {
      folderId = await resolveFolderForKnowledgeBase(
        supabase,
        workspace.knowledgeBase.id,
        workspace.organization.id,
        folderIdValue,
      );
    } catch {
      return NextResponse.json({ error: "Invalid folder." }, { status: 400 });
    }
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "A non-empty file is required." },
      { status: 400 },
    );
  }

  if (file.size > MAX_DOCUMENT_BYTES) {
    return NextResponse.json(
      {
        error: `File too large (max ${MAX_DOCUMENT_BYTES / (1024 * 1024)} MB).`,
      },
      { status: 400 },
    );
  }

  const mime =
    normalizeAllowedDocumentMime(file.type) ?? mimeFromFilename(file.name);
  if (!mime) {
    return NextResponse.json(
      {
        error: `Unsupported type. Allowed: PDF, TXT, DOCX (${ALLOWED_DOCUMENT_MIME_TYPES.join(", ")}).`,
      },
      { status: 400 },
    );
  }

  const displayName = sanitizeDisplayFilename(file.name);
  const objectBase = storageObjectBasename(file.name);
  const docId = randomUUID();
  const storagePath = `${workspace.organization.id}/${workspace.knowledgeBase.id}/${docId}/${objectBase}`;
  const { data: source, error: sourceError } = await supabase
    .from("sources")
    .insert({
      organization_id: workspace.organization.id,
      knowledge_base_id: workspace.knowledgeBase.id,
      created_by: user.id,
      source_type: "file",
      title: displayName,
      folder_id: folderId,
      status: "pending",
      metadata: { kind: "file_upload" },
    })
    .select("id")
    .maybeSingle<{ id: string }>();
  if (sourceError || !source) {
    return NextResponse.json(
      { error: sourceError?.message ?? "Could not create source row." },
      { status: 500 },
    );
  }

  const { error: insertError } = await supabase.from("documents").insert({
    id: docId,
    knowledge_base_id: workspace.knowledgeBase.id,
    organization_id: workspace.organization.id,
    uploaded_by: user.id,
    storage_path: storagePath,
    source_id: source.id,
    folder_id: folderId,
    filename: displayName,
    mime_type: mime,
    size_bytes: file.size,
    status: "pending",
  });

  if (insertError) {
    await supabase.from("sources").delete().eq("id", source.id);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(KNOWLEDGE_BUCKET)
    .upload(storagePath, buf, {
      contentType: mime,
      upsert: false,
    });

  if (uploadError) {
    await supabase.from("documents").delete().eq("id", docId);
    await supabase.from("sources").delete().eq("id", source.id);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  await logUsageEvent(supabase, {
    organizationId: workspace.organization.id,
    userId: workspace.profile.id,
    eventType: "document_uploaded",
    metadata: { document_id: docId, filename: displayName, size_bytes: file.size },
  });

  let jobId: string | null = null;
  let inlineError: string | null = null;
  try {
    const queued = await queueDocumentIngestion(supabase, {
      organizationId: workspace.organization.id,
      knowledgeBaseId: workspace.knowledgeBase.id,
      createdBy: user.id,
      documentId: docId,
      sizeBytes: file.size,
      jobType: "file_ingest",
    });
    jobId = queued.jobId;
    inlineError = queued.inlineError;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not queue ingestion job.";
    await supabase
      .from("documents")
      .update({ status: "failed", error_message: message })
      .eq("id", docId);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return applyRateLimitHeaders(
    NextResponse.json({
      id: docId,
      filename: displayName,
      storage_path: storagePath,
      status: inlineError
        ? "pending"
        : shouldInlineIngest(file.size)
          ? "ready"
          : "queued",
      job_id: jobId,
      inline_error: inlineError,
    }),
    rate,
    limitConfig,
  );
}
