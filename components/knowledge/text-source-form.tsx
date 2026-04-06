"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TextSourceForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!content.trim()) {
      setError("Please add some text content.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/documents/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : "Could not save.");
        return;
      }
      setTitle("");
      setContent("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <div>
        <label
          htmlFor="text-source-title"
          className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim"
        >
          Title
        </label>
        <input
          id="text-source-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Operational policy, client notes, SOP..."
          disabled={pending}
          className="mt-2 w-full border border-black bg-white px-3 py-2.5 text-sm text-ui-text outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/15 disabled:opacity-50"
        />
      </div>
      <div>
        <label
          htmlFor="text-source-content"
          className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim"
        >
          Content
        </label>
        <textarea
          id="text-source-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          disabled={pending}
          className="mt-2 w-full resize-y border border-black bg-white px-3 py-2.5 text-sm text-ui-text outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/15 disabled:opacity-50"
          placeholder="Type text that should become part of your knowledge base..."
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="border border-black bg-ui-text px-4 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-ui-ink-deep disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add text source"}
      </button>
      {error ? (
        <p className="text-sm text-ui-warning" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
