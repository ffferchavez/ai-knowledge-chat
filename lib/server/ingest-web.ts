import type { SupabaseClient } from "@supabase/supabase-js";

import { splitIntoChunks } from "@/lib/server/chunking";
import { fetchWebPage } from "@/lib/server/crawl";
import { getEmbeddingModel, getOpenAIClient } from "@/lib/server/openai";

type SourceRow = {
  id: string;
  organization_id: string;
  knowledge_base_id: string;
  metadata: { seed_url?: string; url?: string } | null;
};

export async function ingestWebSourceById(
  supabase: SupabaseClient,
  sourceId: string,
) {
  const { data: source, error: sourceError } = await supabase
    .from("sources")
    .select("id, organization_id, knowledge_base_id, metadata")
    .eq("id", sourceId)
    .maybeSingle<SourceRow>();
  if (sourceError || !source) {
    throw new Error(sourceError?.message ?? "Source not found.");
  }

  const seedUrl = source.metadata?.seed_url ?? source.metadata?.url;
  if (!seedUrl) {
    throw new Error("Web source metadata missing seed URL.");
  }

  await supabase
    .from("sources")
    .update({ status: "processing", error_message: null })
    .eq("id", source.id);

  try {
    const page = await fetchWebPage(seedUrl);

    const { data: pageRow, error: pageError } = await supabase
      .from("source_pages")
      .upsert(
        {
          source_id: source.id,
          knowledge_base_id: source.knowledge_base_id,
          organization_id: source.organization_id,
          url: seedUrl,
          canonical_url: page.url,
          title: page.title,
          extracted_text: page.text,
          status: "ready",
        },
        { onConflict: "source_id,url" },
      )
      .select("id")
      .maybeSingle<{ id: string }>();

    if (pageError || !pageRow) {
      throw new Error(pageError?.message ?? "Could not persist source page.");
    }

    const chunks = splitIntoChunks(page.text);
    if (chunks.length === 0) {
      throw new Error("No chunks generated from fetched page.");
    }

    const openai = getOpenAIClient();
    const embeddingsResponse = await openai.embeddings.create({
      model: getEmbeddingModel(),
      input: chunks.map((c) => c.content),
    });

    if (embeddingsResponse.data.length !== chunks.length) {
      throw new Error("Embedding count mismatch for web source.");
    }

    await supabase.from("document_chunks").delete().eq("source_page_id", pageRow.id);

    const insertPayload = chunks.map((chunk, idx) => ({
      source_page_id: pageRow.id,
      knowledge_base_id: source.knowledge_base_id,
      organization_id: source.organization_id,
      chunk_index: chunk.index,
      content: chunk.content,
      embedding: embeddingsResponse.data[idx]?.embedding,
      token_count: chunk.tokenEstimate,
    }));

    const { error: insertError } = await supabase
      .from("document_chunks")
      .insert(insertPayload);
    if (insertError) {
      throw new Error(insertError.message);
    }

    await supabase
      .from("sources")
      .update({
        status: "ready",
        error_message: null,
        indexed_at: new Date().toISOString(),
      })
      .eq("id", source.id);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Web source ingestion failed.";
    await supabase
      .from("sources")
      .update({ status: "failed", error_message: message })
      .eq("id", source.id);
    throw new Error(message);
  }
}
