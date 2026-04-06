"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProcessJobsButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    try {
      const secret = window.prompt("CRON secret for /api/jobs/process?");
      if (!secret) return;
      const res = await fetch("/api/jobs/process?limit=5", {
        method: "POST",
        headers: { "x-cron-secret": secret },
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not process jobs.");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="border border-black bg-ui-text px-3 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-white disabled:opacity-50"
      >
        {pending ? "Processing…" : "Process queued jobs"}
      </button>
      {error ? <p className="text-xs text-ui-warning">{error}</p> : null}
    </div>
  );
}
