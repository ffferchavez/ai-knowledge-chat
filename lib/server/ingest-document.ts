import type { createClient } from "@/lib/supabase/server";

import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  KNOWLEDGE_BUCKET,
  mimeFromFilename,
  normalizeAllowedDocumentMime,
} from "@/lib/documents-policy";
import { splitIntoChunks } from "@/lib/server/chunking";
import { getEmbeddingModel, getOpenAIClient } from "@/lib/server/openai";
import { parseDocumentByMime } from "@/lib/server/parsers";

type DocumentRow = {
  id: string;
  knowledge_base_id: string;
  organization_id: string;
  filename: string;
  mime_type: string | null;
  storage_path: string;
  source_id?: string | null;
};

export type DocumentIngestionResult = {
  id: string;
  status: "ready";
  chunk_count: number;
};

export async function ingestDocumentById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  documentId: string,
): Promise<DocumentIngestionResult> {
  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select(
      "id, knowledge_base_id, organization_id, filename, mime_type, storage_path, source_id",
    )
    .eq("id", documentId)
    .maybeSingle<DocumentRow>();

  if (fetchError || !doc) {
    throw new Error(fetchError?.message ?? "Document not found");
  }

  const mime =
    normalizeAllowedDocumentMime(doc.mime_type) ??
    mimeFromFilename(doc.filename);

  if (!mime) {
    const message = `Unsupported type. Allowed: ${ALLOWED_DOCUMENT_MIME_TYPES.join(", ")}`;
    await supabase
      .from("documents")
      .update({ status: "failed", error_message: message })
      .eq("id", doc.id);
    throw new Error(message);
  }

  await supabase
    .from("documents")
    .update({ status: "processing", error_message: null })
    .eq("id", doc.id);
  if (doc.source_id) {
    await supabase
      .from("sources")
      .update({ status: "processing", error_message: null })
      .eq("id", doc.source_id);
  }

  try {
    const { data: downloaded, error: downloadError } = await supabase.storage
      .from(KNOWLEDGE_BUCKET)
      .download(doc.storage_path);

    if (downloadError || !downloaded) {
      throw new Error(
        downloadError?.message ?? "Could not download document file.",
      );
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
    if (doc.source_id) {
      await supabase
        .from("sources")
        .update({
          status: "ready",
          error_message: null,
          indexed_at: new Date().toISOString(),
        })
        .eq("id", doc.source_id);
    }

    return {
      id: doc.id,
      status: "ready",
      chunk_count: chunks.length,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Document ingestion failed.";
    await supabase
      .from("documents")
      .update({ status: "failed", error_message: message })
      .eq("id", doc.id);
    if (doc.source_id) {
      await supabase
        .from("sources")
        .update({ status: "failed", error_message: message })
        .eq("id", doc.source_id);
    }
    throw new Error(message);
  }
}
