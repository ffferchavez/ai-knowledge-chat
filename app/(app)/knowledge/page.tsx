import { redirect } from "next/navigation";

import { DeleteDocumentButton } from "@/components/knowledge/delete-document-button";
import { DocumentUploadForm } from "@/components/knowledge/document-upload-form";
import { EditTextSourceButton } from "@/components/knowledge/edit-text-source-button";
import { IndexDocumentButton } from "@/components/knowledge/index-document-button";
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

function sourceTypeLabel(mimeType: string | null) {
  if (mimeType?.startsWith("text/plain")) return "Text";
  return "File";
}

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
    .limit(20);

  const rows = documents ?? [];

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
          {snap.organization.name} · {snap.knowledgeBase.name}. Upload files to
          your private bucket; ingestion queues automatically and embeddings are
          stored in pgvector.
        </p>
      </header>

      <section className="mt-0 w-full border-t border-black py-8 sm:py-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim">
          Files
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ui-muted">
          {docsError
            ? `Could not load documents: ${docsError.message}`
            : "Upload PDF, TXT, or Word documents. Small files index inline; larger files are queued for the ingestion worker."}
        </p>
        {!docsError ? <DocumentUploadForm /> : null}
      </section>

      <section className="w-full border-t border-black py-8 sm:py-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim">
          Text
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ui-muted">
          Add plain text directly to your knowledge base, then view/edit/reindex
          it like any other source.
        </p>
        {!docsError ? <TextSourceForm /> : null}
      </section>

      {!docsError ? (
        <section className="w-full border-t border-black py-8 sm:py-10">
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim">
            Library
          </p>
          {rows.length === 0 ? (
            <p className="mt-4 text-sm text-ui-muted">
              No files yet. Upload a document above to see it listed here.
            </p>
          ) : (
            <div className="mt-6 w-full overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-black">
                    <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">
                      Name
                    </th>
                    <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">
                      Type
                    </th>
                    <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">
                      Status
                    </th>
                    <th className="hidden pb-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim sm:table-cell">
                      Chunks
                    </th>
                    <th className="hidden pb-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim md:table-cell">
                      Size
                    </th>
                    <th className="hidden pb-3 pr-4 text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim lg:table-cell">
                      Added
                    </th>
                    <th className="pb-3 text-right text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-black/20 last:border-0"
                    >
                      <td className="max-w-[12rem] py-4 pr-4 align-top font-medium text-ui-text sm:max-w-none">
                        <span className="line-clamp-2">{doc.filename}</span>
                        {doc.status === "failed" && doc.error_message ? (
                          <p className="mt-1 text-xs font-normal text-ui-warning">
                            {doc.error_message}
                          </p>
                        ) : null}
                      </td>
                      <td className="py-4 pr-4 align-top">
                        <span className="inline-flex items-center border border-black/20 bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-ui-muted">
                          {sourceTypeLabel(doc.mime_type)}
                        </span>
                      </td>
                      <td className="py-4 pr-4 align-top text-ui-muted">
                        {statusLabel(doc.status)}
                      </td>
                      <td className="hidden py-4 pr-4 align-top tabular-nums text-ui-muted sm:table-cell">
                        {doc.chunk_count}
                      </td>
                      <td className="hidden py-4 pr-4 align-top tabular-nums text-ui-muted md:table-cell">
                        {formatBytes(doc.size_bytes)}
                      </td>
                      <td className="hidden py-4 pr-4 align-top text-ui-muted lg:table-cell">
                        {doc.created_at
                          ? new Date(doc.created_at).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "—"}
                      </td>
                      <td className="py-4 align-top">
                        <div className="flex flex-col items-end gap-3">
                          {doc.mime_type?.startsWith("text/plain") ? (
                            <EditTextSourceButton documentId={doc.id} />
                          ) : null}
                          <IndexDocumentButton
                            documentId={doc.id}
                            status={doc.status}
                          />
                          <DeleteDocumentButton documentId={doc.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      <section className="w-full border-t border-black py-8 sm:py-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim">
          Websites
        </p>
        <p className="mt-2 text-lg font-medium tracking-[-0.02em] text-ui-text sm:mt-3 sm:text-xl md:text-2xl">
          URL ingest &amp; crawl
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ui-muted sm:mt-3">
          Add a URL and we fetch, extract, embed, and index the page through the
          same ingestion jobs pipeline.
        </p>
        {!docsError ? <WebsiteSourceForm /> : null}
        {webSources && webSources.length > 0 ? (
          <div className="mt-6 space-y-2 border-t border-black/20 pt-4">
            {webSources.map((source) => (
              <div
                key={source.id}
                className="flex flex-wrap items-center justify-between gap-2 border border-black/20 bg-white px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ui-text">{source.title}</p>
                  {source.error_message ? (
                    <p className="text-xs text-ui-warning">{source.error_message}</p>
                  ) : null}
                </div>
                <span className="text-xs uppercase tracking-[0.15em] text-ui-muted-dim">
                  {statusLabel(source.status)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
