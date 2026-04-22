"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateFolderForm({
  parentFolderId,
}: {
  parentFolderId: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a folder name.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/knowledge/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          parentFolderId: parentFolderId ?? undefined,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not create folder.");
        return;
      }
      setName("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
      <div className="min-w-[12rem] flex-1">
        <label
          htmlFor="new-folder-name"
          className="text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim"
        >
          New folder
        </label>
        <input
          id="new-folder-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Policies, Clients…"
          disabled={pending}
          className="mt-1.5 w-full min-w-0 border border-black bg-white px-3 py-2 text-sm text-ui-text outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/15 disabled:opacity-50"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 border border-black bg-ui-text px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-ui-ink-deep disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create"}
      </button>
      {error ? (
        <p className="w-full text-xs text-ui-warning" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
