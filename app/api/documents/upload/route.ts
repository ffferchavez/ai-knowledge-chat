import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  KNOWLEDGE_BUCKET,
  MAX_DOCUMENT_BYTES,
  isAllowedDocumentMime,
  mimeFromFilename,
  sanitizeDisplayFilename,
  storageObjectBasename,
} from "@/lib/documents-policy";
import { createClient } from "@/lib/supabase/server";
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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
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
    isAllowedDocumentMime(file.type) ? file.type : mimeFromFilename(file.name);
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

  const { error: insertError } = await supabase.from("documents").insert({
    id: docId,
    knowledge_base_id: workspace.knowledgeBase.id,
    organization_id: workspace.organization.id,
    uploaded_by: user.id,
    storage_path: storagePath,
    filename: displayName,
    mime_type: mime,
    size_bytes: file.size,
    status: "pending",
  });

  if (insertError) {
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
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  return NextResponse.json({
    id: docId,
    filename: displayName,
    storage_path: storagePath,
    status: "pending",
  });
}
