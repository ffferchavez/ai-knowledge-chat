import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { KNOWLEDGE_BUCKET } from "@/lib/documents-policy";
import { splitIntoChunks } from "@/lib/server/chunking";
import { requireDevAdmin } from "@/lib/server/dev-guard";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceSnapshot } from "@/lib/workspace";

export async function POST(request: Request) {
  const guard = requireDevAdmin(request);
  if (guard) return guard;

  const workspace = await getWorkspaceSnapshot();
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 403 });
  }
  const supabase = await createClient();

  const sourceTitle = "dev-seed-knowledge";
  const content =
    "Sample knowledge for the demo: Acme Co. makes tools for organizing team documents. Support replies within one business day. Annual plans renew automatically unless you cancel 30 days before renewal. Security reviews and privacy questions go through the in-app help form.";

  const sourceId = randomUUID();
  const documentId = randomUUID();
  const storagePath = `${workspace.organization.id}/${workspace.knowledgeBase.id}/${documentId}/dev-seed-knowledge.txt`;
  const chunks = splitIntoChunks(content);

  const { error: sourceError } = await supabase.from("sources").insert({
    id: sourceId,
    organization_id: workspace.organization.id,
    knowledge_base_id: workspace.knowledgeBase.id,
    created_by: workspace.profile.id,
    source_type: "file",
    title: sourceTitle,
    status: "ready",
    indexed_at: new Date().toISOString(),
    metadata: { seeded: true },
  });
  if (sourceError) {
    return NextResponse.json({ error: sourceError.message }, { status: 500 });
  }

  const { error: docError } = await supabase.from("documents").insert({
    id: documentId,
    source_id: sourceId,
    knowledge_base_id: workspace.knowledgeBase.id,
    organization_id: workspace.organization.id,
    uploaded_by: workspace.profile.id,
    storage_path: storagePath,
    filename: "dev-seed-knowledge.txt",
    mime_type: "text/plain",
    size_bytes: Buffer.byteLength(content, "utf8"),
    status: "ready",
    chunk_count: chunks.length,
  });
  if (docError) {
    return NextResponse.json({ error: docError.message }, { status: 500 });
  }

  await supabase.storage.from(KNOWLEDGE_BUCKET).upload(storagePath, content, {
    contentType: "text/plain",
    upsert: true,
  });

  const { error: chunkError } = await supabase.from("document_chunks").insert(
    chunks.map((chunk) => ({
      document_id: documentId,
      knowledge_base_id: workspace.knowledgeBase.id,
      organization_id: workspace.organization.id,
      chunk_index: chunk.index,
      content: chunk.content,
      token_count: chunk.tokenEstimate,
      embedding: null,
    })),
  );
  if (chunkError) {
    return NextResponse.json({ error: chunkError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    source_id: sourceId,
    document_id: documentId,
    chunks: chunks.length,
  });
}
