"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SourceActions({
  sourceId,
  sourceType,
}: {
  sourceId: string;
  sourceType: "web" | "file" | "text";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reindex() {
    setError(null);
    setPending(true);
    try {
      const res =
        sourceType === "web"
          ? await fetch(`/api/sources/${sourceId}/reindex`, { method: "POST" })
          : await fetch("/api/ingest", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ documentId: sourceId }),
            });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Reindex failed.");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!globalThis.confirm("Delete this source?")) return;
    setError(null);
    setPending(true);
    try {
      const res =
        sourceType === "web"
          ? await fetch(`/api/sources/${sourceId}`, { method: "DELETE" })
          : await fetch(`/api/documents/${sourceId}`, { method: "DELETE" });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Delete failed.");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {sourceType === "web" ? (
        <Link
          href={`/knowledge/${sourceId}`}
          className="text-[13px] font-medium tracking-wide text-ui-muted underline-offset-4 hover:text-ui-text hover:underline"
        >
          View
        </Link>
      ) : null}
      <button
        type="button"
        onClick={reindex}
        disabled={pending}
        className="text-[13px] font-medium tracking-wide text-ui-muted underline-offset-4 hover:text-ui-text hover:underline disabled:opacity-50"
      >
        Reindex
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="text-[13px] font-medium tracking-wide text-ui-muted underline-offset-4 hover:text-ui-text hover:underline disabled:opacity-50"
      >
        Delete
      </button>
      {error ? <p className="max-w-[14rem] text-right text-xs text-ui-warning">{error}</p> : null}
    </div>
  );
}
