import type { SupabaseClient } from "@supabase/supabase-js";

import { getEmbeddingModel, getOpenAIClient } from "@/lib/server/openai";

export type RetrievedChunk = {
  id: string;
  documentId: string;
  filename: string;
  content: string;
  score: number;
};

type ChunkRow = {
  id: string;
  document_id: string;
  content: string;
  embedding: number[] | string | null;
  documents: { filename: string } | null;
};

type RpcRow = {
  chunk_id: string;
  document_id: string;
  filename: string;
  content: string;
  similarity: number;
};

function parseEmbedding(value: number[] | string | null): number[] | null {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function cosineSimilarity(a: number[], b: number[]) {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function lexicalScore(query: string, content: string) {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3);
  if (tokens.length === 0) return 0;
  const hay = content.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (hay.includes(token)) score += 1;
  }
  return score / tokens.length;
}

export async function retrieveRelevantChunks(
  supabase: SupabaseClient,
  input: {
    question: string;
    organizationId: string;
    knowledgeBaseId: string;
    limit?: number;
  },
): Promise<RetrievedChunk[]> {
  const openai = getOpenAIClient();
  const embeddingResponse = await openai.embeddings.create({
    model: getEmbeddingModel(),
    input: input.question,
  });
  const queryEmbedding = embeddingResponse.data[0]?.embedding ?? null;
  if (!queryEmbedding) return [];

  // Preferred path: pgvector function (add 003 migration). Fallback below.
  const { data: rpcData, error: rpcError } = await supabase
    .rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      org_id: input.organizationId,
      kb_id: input.knowledgeBaseId,
      match_count: input.limit ?? 6,
      min_similarity: 0.04,
    })
    .returns<RpcRow[]>();

  if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
    return rpcData.map((row) => ({
      id: row.chunk_id,
      documentId: row.document_id,
      filename: row.filename,
      content: row.content,
      score: row.similarity,
    }));
  }

  const { data, error } = await supabase
    .from("document_chunks")
    .select("id, document_id, content, embedding, documents(filename)")
    .eq("organization_id", input.organizationId)
    .eq("knowledge_base_id", input.knowledgeBaseId)
    .limit(250)
    .returns<ChunkRow[]>();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not load chunks for retrieval.");
  }
  if (data.length === 0) return [];

  const ranked = data
    .map((row) => {
      const emb = parseEmbedding(row.embedding);
      const vectorScore = emb ? cosineSimilarity(queryEmbedding, emb) : 0;
      const textScore = lexicalScore(input.question, row.content);
      const score = vectorScore * 0.85 + textScore * 0.15;
      return {
        id: row.id,
        documentId: row.document_id,
        filename: row.documents?.filename ?? "Untitled",
        content: row.content,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  const MIN_SCORE = 0.04;
  return ranked.filter((r) => r.score >= MIN_SCORE).slice(0, input.limit ?? 6);
}
