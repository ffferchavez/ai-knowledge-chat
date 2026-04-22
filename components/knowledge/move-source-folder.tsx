"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MoveSourceFolder({
  documentId,
  webSourceId,
  folderOptions,
}: {
  documentId?: string;
  webSourceId?: string;
  folderOptions: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setError(null);
    setPending(true);
    try {
      const folderId = value === "unfiled" ? null : value;
      const res = await fetch("/api/knowledge/folders/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId,
          ...(documentId ? { documentId } : {}),
          ...(webSourceId ? { webSourceId } : {}),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not move.");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-w-[10rem] flex-col gap-1">
      <label className="sr-only" htmlFor={`move-${documentId ?? webSourceId}`}>
        Move to folder
      </label>
      <select
        id={`move-${documentId ?? webSourceId}`}
        defaultValue=""
        disabled={pending}
        onChange={onChange}
        className="max-w-full border border-black/20 bg-white px-2 py-1.5 text-[11px] text-ui-text outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/15 disabled:opacity-50"
      >
        <option value="" disabled>
          Move to...
        </option>
        <option value="unfiled">Unfiled</option>
        {folderOptions.map((f) => (
          <option key={f.id} value={f.id}>
            {f.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-[10px] text-ui-warning">{error}</span> : null}
    </div>
  );
}
