"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EditTextSourceButton({
  documentId,
}: {
  documentId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function openEditor() {
    if (open) {
      setOpen(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/content`);
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        filename?: string;
        content?: string;
      };
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : "Could not load.");
        return;
      }
      const name = String(body.filename ?? "");
      setTitle(name.endsWith(".txt") ? name.slice(0, -4) : name);
      setContent(String(body.content ?? ""));
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : "Could not save.");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex w-full max-w-[22rem] flex-col items-end gap-2">
      <button
        type="button"
        onClick={openEditor}
        disabled={pending || loading}
        className="text-[13px] font-medium tracking-wide text-ui-muted underline-offset-4 transition-colors hover:text-ui-ink-deep hover:underline disabled:opacity-50"
      >
        {loading ? "Loading…" : open ? "Close" : "View / Edit"}
      </button>
      {open ? (
        <div className="glass-muted w-full space-y-2 p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="ui-input w-full px-2 py-1.5 text-sm"
            placeholder="Title"
            disabled={pending}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="ui-input w-full resize-y px-2 py-1.5 text-sm"
            disabled={pending}
          />
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="ui-btn ui-btn-primary min-h-0 rounded-none px-3 py-1.5 text-[11px] uppercase tracking-[0.18em]"
          >
            {pending ? "Saving…" : "Save & reindex"}
          </button>
        </div>
      ) : null}
      {error ? (
        <p className="max-w-[18rem] text-right text-xs text-ui-warning" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
