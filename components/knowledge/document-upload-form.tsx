"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ACCEPT =
  ".pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function DocumentUploadForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const form = e.currentTarget;
    const input = form.elements.namedItem("file") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      setMessage("Choose a file first.");
      return;
    }
    setPending(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: fd,
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setMessage(
          typeof body.error === "string" ? body.error : "Upload failed.",
        );
        return;
      }
      input.value = "";
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label
            htmlFor="knowledge-file"
            className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim"
          >
            File
          </label>
          <input
            id="knowledge-file"
            name="file"
            type="file"
            accept={ACCEPT}
            disabled={pending}
            className="mt-2 block w-full border border-black bg-white px-3 py-2.5 text-sm text-ui-text file:mr-4 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ui-text outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/15 disabled:opacity-50"
          />
          <p className="mt-2 text-xs leading-relaxed text-ui-muted">
            PDF, TXT, or DOCX · up to 50 MB · indexing starts automatically
            after upload (inline for small files, queued worker for larger
            files).
          </p>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 border border-black bg-ui-text px-4 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-ui-ink-deep disabled:opacity-50"
        >
          {pending ? "Uploading…" : "Upload"}
        </button>
      </div>
      {message ? (
        <p className="text-sm text-ui-warning" role="alert">
          {message}
        </p>
      ) : null}
    </form>
  );
}
