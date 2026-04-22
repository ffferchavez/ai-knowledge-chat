import type { ReactNode } from "react";

import { DocumentUploadForm } from "@/components/knowledge/document-upload-form";
import { ErpNextSourcePlaceholder } from "@/components/knowledge/erpnext-source-placeholder";
import { TextSourceForm } from "@/components/knowledge/text-source-form";
import { WebsiteSourceForm } from "@/components/knowledge/website-source-form";

function FileIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      <path
        d="M8 13h8M8 17h6M8 9h4"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16M4 12h10M4 18h14"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function WebIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.5} />
      <path
        d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"
        stroke="currentColor"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function ErpIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path d="M8 12h8M8 16h5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function SourceCard({
  icon,
  title,
  description,
  badge,
  children,
  muted,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  badge?: string;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <article
      className={[
        "flex h-full min-h-[26rem] flex-col border bg-white p-5 sm:p-6",
        muted
          ? "border-dashed border-black/20 bg-neutral-50/40"
          : "border-black/10 shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03]",
      ].join(" ")}
    >
      <div className="flex gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center bg-[#f4f4f0] text-neutral-700 ring-1 ring-black/10">
          {icon}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold leading-tight tracking-[-0.02em] text-ui-text">
              {title}
            </h3>
            {badge ? (
              <span className="bg-neutral-200/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-[13px] leading-snug text-ui-muted">{description}</p>
        </div>
      </div>
      <div className="mt-5 flex min-h-0 flex-1 flex-col border-t border-black/10 pt-5">
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </article>
  );
}

export function AddSourceCardsSection({
  documentsError,
  defaultFolderId,
}: {
  documentsError: string | null;
  defaultFolderId?: string | null;
}) {
  return (
    <section className="w-full border-t border-black py-8 sm:py-10">
      <div className="max-w-[1600px]">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim">
          Add sources
        </p>
        <h2 className="mt-2 text-lg font-medium tracking-[-0.02em] text-ui-text sm:text-xl">
          Bring content into this knowledge base
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ui-muted">
          Pick a channel. Uploads and URL crawls enqueue ingestion automatically; run the queue
          from the section above if something stays pending.
        </p>
        {defaultFolderId ? (
          <p className="mt-2 text-xs text-ui-muted">
            New items below are added to the{" "}
            <span className="font-medium text-ui-text">currently selected folder</span>.
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-4 xl:items-stretch xl:gap-5">
          <SourceCard
            icon={<FileIcon />}
            title="File"
            description="PDF, Word, or plain text for policies, SOPs, and long-form docs."
          >
            {documentsError ? (
              <p className="text-sm text-ui-warning" role="alert">
                {documentsError}
              </p>
            ) : (
              <DocumentUploadForm compact defaultFolderId={defaultFolderId} />
            )}
          </SourceCard>

          <SourceCard
            icon={<TextIcon />}
            title="Text"
            description="Paste notes, snippets, or lightweight policies without a file."
          >
            {documentsError ? null : (
              <TextSourceForm compact defaultFolderId={defaultFolderId} />
            )}
          </SourceCard>

          <SourceCard
            icon={<WebIcon />}
            title="Website"
            description="Index a public page; we fetch once and chunk for search."
          >
            {documentsError ? null : (
              <WebsiteSourceForm compact defaultFolderId={defaultFolderId} />
            )}
          </SourceCard>

          <SourceCard
            icon={<ErpIcon />}
            title="Helion Ops"
            description="Connect operations data into the same retrieval layer."
            badge="Soon"
            muted
          >
            <ErpNextSourcePlaceholder />
          </SourceCard>
        </div>
      </div>
    </section>
  );
}
