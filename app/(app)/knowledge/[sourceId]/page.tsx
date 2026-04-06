import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getWorkspaceSnapshot } from "@/lib/workspace";

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const { sourceId } = await params;
  const workspace = await getWorkspaceSnapshot();
  if (!workspace) redirect("/login");

  const supabase = await createClient();
  const { data: source } = await supabase
    .from("sources")
    .select("id, title, source_type, status, error_message, indexed_at, metadata, created_at")
    .eq("id", sourceId)
    .eq("knowledge_base_id", workspace.knowledgeBase.id)
    .maybeSingle();
  if (!source) notFound();

  const { data: pages } = await supabase
    .from("source_pages")
    .select("id, url, canonical_url, title, status, fetch_error, updated_at")
    .eq("source_id", sourceId)
    .order("updated_at", { ascending: false })
    .limit(50);

  return (
    <div className="flex w-full min-w-0 flex-col">
      <header className="w-full border-b border-black pb-8 sm:pb-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-ui-muted-dim">
          Source Detail
        </p>
        <h1 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-ui-text sm:mt-4 sm:text-3xl md:text-4xl">
          {source.title}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ui-muted">
          Type: {source.source_type} · Status: {source.status}
          {source.indexed_at ? ` · Indexed ${new Date(source.indexed_at).toLocaleString()}` : ""}
        </p>
        {source.error_message ? (
          <p className="mt-3 text-sm text-ui-warning">{source.error_message}</p>
        ) : null}
      </header>

      <section className="mt-0 w-full border-t border-black py-8 sm:py-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim">
          Pages ({pages?.length ?? 0})
        </p>
        <div className="mt-4 space-y-3">
          {!pages || pages.length === 0 ? (
            <p className="text-sm text-ui-muted">No pages indexed yet.</p>
          ) : (
            pages.map((page) => (
              <article key={page.id} className="border border-black/20 bg-white px-4 py-3">
                <p className="truncate text-sm font-medium text-ui-text">
                  {page.title || page.canonical_url || page.url}
                </p>
                <p className="mt-1 truncate text-xs text-ui-muted">{page.canonical_url || page.url}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-ui-muted-dim">
                  {page.status}
                </p>
                {page.fetch_error ? <p className="mt-1 text-xs text-ui-warning">{page.fetch_error}</p> : null}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
