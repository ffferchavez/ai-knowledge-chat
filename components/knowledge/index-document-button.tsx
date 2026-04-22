"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function IndexDocumentButton({
  documentId,
  status,
}: {
  documentId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = pending || status === "processing";

  async function onClick() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : "Queueing failed.");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="text-[13px] font-medium tracking-wide text-ui-muted underline-offset-4 transition-colors hover:text-ui-ink-deep hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending
          ? "Queueing…"
          : status === "failed"
            ? "Retry"
            : status === "ready"
              ? "Reindex"
              : "Index now"}
      </button>
      {error ? (
        <p className="max-w-[14rem] text-right text-xs text-ui-warning" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
