"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RetryJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/retry`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Retry failed.");
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
        disabled={pending}
        className="text-[11px] uppercase tracking-[0.12em] text-ui-muted underline underline-offset-4 hover:text-ui-ink-deep disabled:opacity-50"
      >
        {pending ? "Retrying…" : "Retry"}
      </button>
      {error ? <p className="text-xs text-ui-warning">{error}</p> : null}
    </div>
  );
}
