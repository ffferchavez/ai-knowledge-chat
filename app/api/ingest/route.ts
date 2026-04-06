import { NextResponse } from "next/server";

import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  KNOWLEDGE_BUCKET,
  isAllowedDocumentMime,
  mimeFromFilename,
} from "@/lib/documents-policy";
import { splitIntoChunks } from "@/lib/server/chunking";
import { getEmbeddingModel, getOpenAIClient } from "@/lib/server/openai";
import { parseDocumentByMime } from "@/lib/server/parsers";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceSnapshot } from "@/lib/workspace";

type DocumentRow = {
  id: string;
  knowledge_base_id: string;
  organization_id: string;
  filename: string;
  mime_type: string | null;
  storage_path: string;
  status: string;
};

async function processDocument(doc: DocumentRow) {
  const supabase = await createClient();

  const mime =
    isAllowedDocumentMime(doc.mime_type)
      ? doc.mime_type
      : mimeFromFilename(doc.filename);

  if (!mime) {
    await supabase
      .from("documents")
      .update({
        status: "failed",
        error_message: `Unsupported type. Allowed: ${ALLOWED_DOCUMENT_MIME_TYPES.join(", ")}`,
      })
      .eq("id", doc.id);
    throw new Error("Unsupported document type");
  }

  await supabase
    .from("documents")
    .update({ status: "processing", error_message: null })
    .eq("id", doc.id);

  const { data: downloaded, error: downloadError } = await supabase.storage
    .from(KNOWLEDGE_BUCKET)
    .download(doc.storage_path);

  if (downloadError || !downloaded) {
    throw new Error(downloadError?.message ?? "Could not download document file.");
  }

  const buffer = Buffer.from(await downloaded.arrayBuffer());
  const extracted = await parseDocumentByMime(mime, buffer);

  if (!extracted) {
    throw new Error("No text could be extracted from this document.");
  }

  const chunks = splitIntoChunks(extracted);
  if (chunks.length === 0) {
    throw new Error("No chunks were generated from document text.");
  }

  const embeddingClient = getOpenAIClient();
  const embeddingModel = getEmbeddingModel();
  const embeddingsResponse = await embeddingClient.embeddings.create({
    model: embeddingModel,
    input: chunks.map((c) => c.content),
  });

  if (embeddingsResponse.data.length !== chunks.length) {
    throw new Error("Embedding count mismatch from OpenAI response.");
  }

  await supabase.from("document_chunks").delete().eq("document_id", doc.id);

  const payload = chunks.map((chunk, idx) => ({
    document_id: doc.id,
    knowledge_base_id: doc.knowledge_base_id,
    organization_id: doc.organization_id,
    chunk_index: chunk.index,
    content: chunk.content,
    embedding: embeddingsResponse.data[idx]?.embedding,
    token_count: chunk.tokenEstimate,
  }));

  const { error: insertChunksError } = await supabase
    .from("document_chunks")
    .insert(payload);

  if (insertChunksError) {
    throw new Error(insertChunksError.message);
  }

  const { error: completeError } = await supabase
    .from("documents")
    .update({
      status: "ready",
      error_message: null,
      chunk_count: chunks.length,
    })
    .eq("id", doc.id);

  if (completeError) {
    throw new Error(completeError.message);
  }

  return {
    id: doc.id,
    status: "ready",
    chunk_count: chunks.length,
  };
}

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

  const body = (await request.json().catch(() => ({}))) as {
    documentId?: string;
  };

  if (!body.documentId) {
    return NextResponse.json(
      { error: "documentId is required" },
      { status: 400 },
    );
  }

  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select(
      "id, knowledge_base_id, organization_id, filename, mime_type, storage_path, status",
    )
    .eq("id", body.documentId)
    .eq("knowledge_base_id", workspace.knowledgeBase.id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  try {
    const result = await processDocument(doc);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ingestion failed.";
    await supabase
      .from("documents")
      .update({ status: "failed", error_message: message })
      .eq("id", doc.id);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
