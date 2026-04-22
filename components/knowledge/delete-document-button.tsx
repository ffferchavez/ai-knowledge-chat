"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteDocumentButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    if (
      !globalThis.confirm(
        "Remove this file from your knowledge base? Stored chunks will be deleted with it.",
      )
    ) {
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(
          typeof body.error === "string" ? body.error : "Could not remove file.",
        );
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
        className="text-[13px] font-medium tracking-wide text-ui-muted underline-offset-4 transition-colors hover:text-ui-ink-deep hover:underline disabled:opacity-50"
      >
        {pending ? "Removing…" : "Remove"}
      </button>
      {error ? (
        <p className="max-w-[12rem] text-right text-xs text-ui-warning" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
