import Link from "next/link";
import { redirect } from "next/navigation";

import { AddSourceCardsSection } from "@/components/knowledge/add-source-cards-section";
import { CreateFolderForm } from "@/components/knowledge/create-folder-form";
import { KnowledgeFolderNav } from "@/components/knowledge/knowledge-folder-nav";
import { MoveSourceFolder } from "@/components/knowledge/move-source-folder";
import { RetryJobButton } from "@/components/knowledge/retry-job-button";
import { SourceActions } from "@/components/knowledge/source-actions";
import { formatBytes } from "@/lib/format-bytes";
import type { SourceFolderRow } from "@/lib/server/knowledge-folders";
import { folderPathLabel } from "@/lib/server/knowledge-folders";
import { siteConfig } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceSnapshot } from "@/lib/workspace";

export const metadata = {
  title: `Sources — ${siteConfig.name}`,
};

function statusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Pending";
    case "processing":
      return "Processing";
    case "ready":
      return "Ready";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

function importJobLabel(jobType: string) {
  switch (jobType) {
    case "web_crawl":
      return "Website";
    case "file_ingest":
      return "File";
    case "reindex":
      return "Refresh";
    default:
      return "Import";
  }
}

type SourceRow = {
  id: string;
  name: string;
  type: "file" | "text" | "web";
  status: string;
  chunks: number;
  sizeBytes: number | null;
  createdAt: string;
  error: string | null;
  folderId: string | null;
  folderLabel: string | null;
  createdByLabel: string | null;
};

function staleFailedIngestionJob(
  job: { job_type: string; payload: unknown },
  documentIds: Set<string>,
  sourceIds: Set<string>,
) {
  const p = job.payload as Record<string, unknown> | null;
  if (job.job_type === "web_crawl") {
    const sid =
      typeof p?.sourceId === "string"
        ? p.sourceId
        : typeof p?.source_id === "string"
          ? p.source_id
          : null;
    return !sid || !sourceIds.has(sid);
  }
  const docId =
    typeof p?.documentId === "string"
      ? p.documentId
      : typeof p?.document_id === "string"
        ? p.document_id
        : null;
  if (job.job_type === "file_ingest" || job.job_type === "reindex") {
    return !docId || !documentIds.has(docId);
  }
  return false;
}

async function chunkCountByWebSourceId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  knowledgeBaseId: string,
  webSourceIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (webSourceIds.length === 0) return counts;

  const { data: pages } = await supabase
    .from("source_pages")
    .select("id, source_id")
    .eq("knowledge_base_id", knowledgeBaseId)
    .in("source_id", webSourceIds);

  const pageRows = pages ?? [];
  if (pageRows.length === 0) return counts;

  const pageToSource = new Map(pageRows.map((p) => [p.id, p.source_id] as const));
  const pageIds = pageRows.map((p) => p.id);

  const { data: chunkRows } = await supabase
    .from("document_chunks")
    .select("source_page_id")
    .eq("knowledge_base_id", knowledgeBaseId)
    .in("source_page_id", pageIds);

  for (const row of chunkRows ?? []) {
    const sid = row.source_page_id ? pageToSource.get(row.source_page_id) : undefined;
    if (!sid) continue;
    counts.set(sid, (counts.get(sid) ?? 0) + 1);
  }

  return counts;
}

function parseActiveFolder(
  raw: string | string[] | undefined,
): "all" | "unfiled" | string {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v || v === "all") return "all";
  if (v === "unfiled") return "unfiled";
  return v;
}

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const snap = await getWorkspaceSnapshot();
  if (!snap) {
    redirect("/login");
  }

  const sp = (await searchParams) ?? {};
  const activeFolder = parseActiveFolder(sp.folder);
  const supabase = await createClient();

  const { data: folderRows } = await supabase
    .from("source_folders")
    .select("id, knowledge_base_id, parent_folder_id, name")
    .eq("knowledge_base_id", snap.knowledgeBase.id)
    .order("name");
  const folders = (folderRows ?? []) as SourceFolderRow[];
  if (activeFolder !== "all" && activeFolder !== "unfiled") {
    const ok = folders.some((f) => f.id === activeFolder);
    if (!ok) redirect("/knowledge");
  }

  let docsQuery = supabase
    .from("documents")
    .select(
      "id, filename, mime_type, size_bytes, status, error_message, chunk_count, created_at, uploaded_by, folder_id",
    )
    .eq("knowledge_base_id", snap.knowledgeBase.id);
  if (activeFolder === "unfiled") {
    docsQuery = docsQuery.is("folder_id", null);
  } else if (activeFolder !== "all") {
    docsQuery = docsQuery.eq("folder_id", activeFolder);
  }
  const { data: documents, error: docsError } = await docsQuery.order("created_at", {
    ascending: false,
  });

  let webQuery = supabase
    .from("sources")
    .select("id, title, status, error_message, created_at, created_by, folder_id")
    .eq("knowledge_base_id", snap.knowledgeBase.id)
    .eq("source_type", "web");
  if (activeFolder === "unfiled") {
    webQuery = webQuery.is("folder_id", null);
  } else if (activeFolder !== "all") {
    webQuery = webQuery.eq("folder_id", activeFolder);
  }
  const { data: webSources } = await webQuery
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: jobCounts } = await supabase
    .from("ingestion_jobs")
    .select("status")
    .eq("knowledge_base_id", snap.knowledgeBase.id)
    .in("status", ["queued", "running"]);
  const { data: failedJobsRaw } = await supabase
    .from("ingestion_jobs")
    .select("id, job_type, error_message, attempts, max_attempts, created_at, payload")
    .eq("knowledge_base_id", snap.knowledgeBase.id)
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(200);

  const documentIds = new Set((documents ?? []).map((d) => d.id));
  const sourceIds = new Set((webSources ?? []).map((s) => s.id));
  const failedJobsActive = (failedJobsRaw ?? []).filter(
    (j) => !staleFailedIngestionJob(j, documentIds, sourceIds),
  );
  const failedJobs = failedJobsActive.slice(0, 8);

  const counts = {
    queued: (jobCounts ?? []).filter((j) => j.status === "queued").length,
    running: (jobCounts ?? []).filter((j) => j.status === "running").length,
    failed: failedJobsActive.length,
  };

  const userIds = new Set<string>();
  for (const doc of documents ?? []) {
    if (doc.uploaded_by) userIds.add(doc.uploaded_by);
  }
  for (const src of webSources ?? []) {
    if (src.created_by) userIds.add(src.created_by);
  }
  const profileMap = new Map<string, string>();
  if (userIds.size > 0) {
    const { data: profiles } = await supabase
      .schema("public")
      .from("profiles")
      .select("id, full_name")
      .in("id", [...userIds]);
    for (const p of profiles ?? []) {
      profileMap.set(p.id, p.full_name?.trim() || `${p.id.slice(0, 8)}…`);
    }
  }
  const creatorLabel = (userId: string | null) =>
    userId ? profileMap.get(userId) ?? `${userId.slice(0, 8)}…` : null;

  const fileRows: SourceRow[] = (documents ?? []).map((doc) => ({
    id: doc.id,
    name: doc.filename,
    type: doc.mime_type?.startsWith("text/plain") ? "text" : "file",
    status: doc.status,
    chunks: doc.chunk_count,
    sizeBytes: doc.size_bytes,
    createdAt: doc.created_at,
    error: doc.error_message,
    folderId: doc.folder_id,
    folderLabel: folderPathLabel(folders, doc.folder_id),
    createdByLabel: creatorLabel(doc.uploaded_by),
  }));

  const webIds = (webSources ?? []).map((s) => s.id);
  const webChunkCounts = await chunkCountByWebSourceId(
    supabase,
    snap.knowledgeBase.id,
    webIds,
  );

  const webRows: SourceRow[] = (webSources ?? []).map((s) => ({
    id: s.id,
    name: s.title,
    type: "web",
    status: s.status,
    chunks: webChunkCounts.get(s.id) ?? 0,
    sizeBytes: null,
    createdAt: s.created_at,
    error: s.error_message,
    folderId: s.folder_id,
    folderLabel: folderPathLabel(folders, s.folder_id),
    createdByLabel: creatorLabel(s.created_by),
  }));

  const rows = [...fileRows, ...webRows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const folderOptions = folders.map((f) => ({
    id: f.id,
    label: folderPathLabel(folders, f.id) ?? f.name,
  }));
  const parentForNewFolder =
    activeFolder !== "all" && activeFolder !== "unfiled" ? activeFolder : null;
  const defaultFolderId =
    activeFolder !== "all" && activeFolder !== "unfiled" ? activeFolder : null;
  const folderCrumb =
    activeFolder === "all"
      ? "All sources"
      : activeFolder === "unfiled"
        ? "Unfiled"
        : (folderPathLabel(folders, activeFolder) ?? "Folder");

  return (
    <div className="flex w-full min-w-0 flex-col">
      <header className="glass-panel w-full p-6 sm:p-8">
        <p className="ui-kicker">
          Sources
        </p>
        <h1 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-ui-ink-deep sm:mt-4 sm:text-3xl md:text-4xl">
          Manage your knowledge sources
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ui-muted sm:mt-6 sm:text-base">
          {snap.organization.name} · {snap.knowledgeBase.name}. Add files, text, or
          web pages—everything you add shows up here for chat.
        </p>
      </header>

      <section className="glass-panel mt-4 w-full p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim">Imports</p>
            <p className="mt-2 text-sm text-ui-muted">
              Waiting: {counts.queued} · In progress: {counts.running} · Needs attention:{" "}
              {counts.failed}
            </p>
          </div>
        </div>
        {failedJobs && failedJobs.length > 0 ? (
          <div className="mt-4 space-y-2 border-t border-ui-line-soft pt-3">
            {failedJobs.map((job) => (
              <div
                key={job.id}
                className="glass-muted flex flex-wrap items-start justify-between gap-3 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.14em] text-ui-muted-dim">
                    {importJobLabel(job.job_type)} · try {job.attempts} of {job.max_attempts}
                  </p>
                  <p className="mt-1 max-w-2xl text-sm text-ui-warning">
                    {job.error_message || "Something went wrong while importing."}
                  </p>
                </div>
                <RetryJobButton jobId={job.id} />
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <AddSourceCardsSection
        documentsError={docsError?.message ?? null}
        defaultFolderId={defaultFolderId}
      />

      <section className="glass-panel mt-4 w-full p-6 sm:p-8">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim">All Sources</p>
            <p className="mt-1 text-sm text-ui-muted">
              Viewing: <span className="font-medium text-ui-ink-deep">{folderCrumb}</span>
              {activeFolder !== "all" ? (
                <>
                  {" "}·{" "}
                  <Link href="/knowledge" className="underline-offset-4 hover:text-ui-ink-deep hover:underline">
                    Clear filter
                  </Link>
                </>
              ) : null}
            </p>
          </div>
          <div className="w-full max-w-md lg:w-auto">
            <CreateFolderForm parentFolderId={parentForNewFolder} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(200px,260px)_1fr] lg:items-start">
          <KnowledgeFolderNav folders={folders} active={activeFolder} />
          {rows.length === 0 ? (
            <p className="text-sm text-ui-muted">No sources in this view.</p>
          ) : (
            <div className="glass-muted w-full overflow-x-auto p-3">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ui-line">
                  <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">Name</th>
                  <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">Folder</th>
                  <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">Type</th>
                  <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">Status</th>
                  <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">Segments</th>
                  <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">Size</th>
                  <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">Created by</th>
                  <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">Added</th>
                  <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">Move</th>
                  <th className="pb-3 text-right text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.type}-${row.id}`} className="border-b border-ui-line-soft last:border-0">
                    <td className="max-w-[14rem] py-4 pr-4 align-top font-medium text-ui-ink-deep">
                      <span className="line-clamp-2">{row.name}</span>
                      {row.error ? <p className="mt-1 text-xs font-normal text-ui-warning">{row.error}</p> : null}
                    </td>
                    <td className="max-w-[10rem] py-4 pr-4 align-top text-xs text-ui-muted">
                      {row.folderLabel ?? "—"}
                    </td>
                    <td className="py-4 pr-4 align-top">
                      <span className="inline-flex items-center border border-ui-line bg-ui-surface px-2 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-ui-muted">{row.type}</span>
                    </td>
                    <td className="py-4 pr-4 align-top text-ui-muted">{statusLabel(row.status)}</td>
                    <td className="py-4 pr-4 align-top tabular-nums text-ui-muted">{row.chunks}</td>
                    <td className="py-4 pr-4 align-top tabular-nums text-ui-muted">{formatBytes(row.sizeBytes)}</td>
                    <td className="max-w-[9rem] py-4 pr-4 align-top text-xs text-ui-muted">{row.createdByLabel ?? "—"}</td>
                    <td className="py-4 pr-4 align-top text-ui-muted">{new Date(row.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="py-4 pr-4 align-top">
                      <MoveSourceFolder
                        folderOptions={folderOptions}
                        {...(row.type === "web" ? { webSourceId: row.id } : { documentId: row.id })}
                      />
                    </td>
                    <td className="py-4 align-top">
                      <SourceActions sourceId={row.id} sourceType={row.type} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
