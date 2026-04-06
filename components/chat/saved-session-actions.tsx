"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SavedSessionActions({
  sessionId,
  initialTitle,
}: {
  sessionId: string;
  initialTitle: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveTitle() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : "Could not rename.");
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function deleteSession() {
    if (!globalThis.confirm("Delete this saved session?")) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : "Could not delete.");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {editing ? (
        <>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={pending}
            className="min-w-[180px] border border-black px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={saveTitle}
            disabled={pending}
            className="text-xs uppercase tracking-[0.15em] text-ui-text underline underline-offset-4"
          >
            Save
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={pending}
          className="text-xs uppercase tracking-[0.15em] text-ui-muted underline underline-offset-4 hover:text-ui-text"
        >
          Rename
        </button>
      )}
      <button
        type="button"
        onClick={deleteSession}
        disabled={pending}
        className="text-xs uppercase tracking-[0.15em] text-ui-muted underline underline-offset-4 hover:text-ui-text"
      >
        Delete
      </button>
      {error ? (
        <p className="text-xs text-ui-warning" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
