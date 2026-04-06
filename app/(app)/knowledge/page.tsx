import { redirect } from "next/navigation";

import { DocumentUploadForm } from "@/components/knowledge/document-upload-form";
import { ProcessJobsButton } from "@/components/knowledge/process-jobs-button";
import { RetryJobButton } from "@/components/knowledge/retry-job-button";
import { SourceActions } from "@/components/knowledge/source-actions";
import { TextSourceForm } from "@/components/knowledge/text-source-form";
import { WebsiteSourceForm } from "@/components/knowledge/website-source-form";
import { formatBytes } from "@/lib/format-bytes";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceSnapshot } from "@/lib/workspace";

export const metadata = {
  title: "Sources — Helion Intelligence",
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

type SourceRow = {
  id: string;
  name: string;
  type: "file" | "text" | "web";
  status: string;
  chunks: number;
  sizeBytes: number | null;
  createdAt: string;
  error: string | null;
};

export default async function KnowledgePage() {
  const snap = await getWorkspaceSnapshot();
  if (!snap) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: documents, error: docsError } = await supabase
    .from("documents")
    .select(
      "id, filename, mime_type, size_bytes, status, error_message, chunk_count, created_at",
    )
    .eq("knowledge_base_id", snap.knowledgeBase.id)
    .order("created_at", { ascending: false });

  const { data: webSources } = await supabase
    .from("sources")
    .select("id, title, status, error_message, created_at")
    .eq("knowledge_base_id", snap.knowledgeBase.id)
    .eq("source_type", "web")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: jobCounts } = await supabase
    .from("ingestion_jobs")
    .select("status")
    .eq("knowledge_base_id", snap.knowledgeBase.id)
    .in("status", ["queued", "running", "failed"]);
  const { data: failedJobs } = await supabase
    .from("ingestion_jobs")
    .select("id, job_type, error_message, attempts, max_attempts, created_at")
    .eq("knowledge_base_id", snap.knowledgeBase.id)
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(8);

  const counts = {
    queued: (jobCounts ?? []).filter((j) => j.status === "queued").length,
    running: (jobCounts ?? []).filter((j) => j.status === "running").length,
    failed: (jobCounts ?? []).filter((j) => j.status === "failed").length,
  };

  const fileRows: SourceRow[] = (documents ?? []).map((doc) => ({
    id: doc.id,
    name: doc.filename,
    type: doc.mime_type?.startsWith("text/plain") ? "text" : "file",
    status: doc.status,
    chunks: doc.chunk_count,
    sizeBytes: doc.size_bytes,
    createdAt: doc.created_at,
    error: doc.error_message,
  }));

  const webRows: SourceRow[] = (webSources ?? []).map((s) => ({
    id: s.id,
    name: s.title,
    type: "web",
    status: s.status,
    chunks: 0,
    sizeBytes: null,
    createdAt: s.created_at,
    error: s.error_message,
  }));

  const rows = [...fileRows, ...webRows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="flex w-full min-w-0 flex-col">
      <header className="w-full border-b border-black pb-8 sm:pb-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-ui-muted-dim">
          Sources
        </p>
        <h1 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-ui-text sm:mt-4 sm:text-3xl md:text-4xl">
          Manage your knowledge sources
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ui-muted sm:mt-6 sm:text-base">
          {snap.organization.name} · {snap.knowledgeBase.name}. Files, text, and websites all flow through one indexed sources system.
        </p>
      </header>

      <section className="mt-0 w-full border-t border-black py-8 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim">Ingestion Jobs</p>
            <p className="mt-2 text-sm text-ui-muted">Queued: {counts.queued} · Running: {counts.running} · Failed: {counts.failed}</p>
          </div>
          <ProcessJobsButton />
        </div>
        {failedJobs && failedJobs.length > 0 ? (
          <div className="mt-4 space-y-2 border-t border-black/20 pt-3">
            {failedJobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-wrap items-start justify-between gap-3 border border-black/20 bg-white px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.14em] text-ui-muted-dim">
                    {job.job_type} · attempt {job.attempts}/{job.max_attempts}
                  </p>
                  <p className="mt-1 max-w-2xl text-sm text-ui-warning">
                    {job.error_message || "Unknown ingestion failure."}
                  </p>
                </div>
                <RetryJobButton jobId={job.id} />
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="w-full border-t border-black py-8 sm:py-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim">Add Sources</p>
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="border border-black/20 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-ui-muted-dim">File</p>
            {!docsError ? <DocumentUploadForm /> : <p className="mt-2 text-sm text-ui-warning">{docsError.message}</p>}
          </div>
          <div className="border border-black/20 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-ui-muted-dim">Text</p>
            {!docsError ? <TextSourceForm /> : null}
          </div>
          <div className="border border-black/20 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-ui-muted-dim">Website</p>
            {!docsError ? <WebsiteSourceForm /> : null}
          </div>
        </div>
      </section>

      <section className="w-full border-t border-black py-8 sm:py-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim">All Sources</p>
        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-ui-muted">No sources yet.</p>
        ) : (
          <div className="mt-6 w-full overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-black">
                  <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">Name</th>
                  <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">Type</th>
                  <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">Status</th>
                  <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">Chunks</th>
                  <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">Size</th>
                  <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">Added</th>
                  <th className="pb-3 text-right text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.type}-${row.id}`} className="border-b border-black/20 last:border-0">
                    <td className="max-w-[14rem] py-4 pr-4 align-top font-medium text-ui-text">
                      <span className="line-clamp-2">{row.name}</span>
                      {row.error ? <p className="mt-1 text-xs font-normal text-ui-warning">{row.error}</p> : null}
                    </td>
                    <td className="py-4 pr-4 align-top">
                      <span className="inline-flex items-center border border-black/20 bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-ui-muted">{row.type}</span>
                    </td>
                    <td className="py-4 pr-4 align-top text-ui-muted">{statusLabel(row.status)}</td>
                    <td className="py-4 pr-4 align-top tabular-nums text-ui-muted">{row.chunks}</td>
                    <td className="py-4 pr-4 align-top tabular-nums text-ui-muted">{formatBytes(row.sizeBytes)}</td>
                    <td className="py-4 pr-4 align-top text-ui-muted">{new Date(row.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="py-4 align-top">
                      <SourceActions sourceId={row.id} sourceType={row.type} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
