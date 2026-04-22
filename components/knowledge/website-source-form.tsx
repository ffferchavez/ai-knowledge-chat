"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  compact?: boolean;
  defaultFolderId?: string | null;
};

export function WebsiteSourceForm({ compact, defaultFolderId }: Props) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!url.trim()) {
      setError("URL is required.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/sources/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          title,
          ...(defaultFolderId ? { folderId: defaultFolderId } : {}),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : "Could not add URL.");
        return;
      }
      setUrl("");
      setTitle("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const dense = compact === true;
  const fieldClass = "ui-input mt-2 text-sm disabled:opacity-50";

  return (
    <form
      onSubmit={onSubmit}
      className={dense ? "flex h-full min-h-0 flex-1 flex-col gap-3" : "mt-4 space-y-4"}
    >
      <div className={dense ? "flex min-h-0 flex-1 flex-col gap-3" : "space-y-3"}>
        <div>
        <label
          htmlFor="website-url"
          className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim"
        >
          URL
        </label>
        <input
          id="website-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/docs/pricing"
          disabled={pending}
          className={fieldClass}
        />
      </div>
      <div>
        <label
          htmlFor="website-title"
          className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim"
        >
          Title (optional)
        </label>
        <input
          id="website-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={pending}
          className={fieldClass}
        />
      </div>
      </div>
      <div className={dense ? "mt-auto shrink-0" : ""}>
      <button
        type="submit"
        disabled={pending}
        className={`ui-btn ui-btn-primary min-h-0 rounded-none px-4 py-2 text-xs uppercase tracking-[0.2em] ${dense ? "w-full" : ""}`}
      >
        {pending ? "Adding…" : "Add website"}
      </button>
      </div>
      {error ? (
        <p className="text-sm text-ui-warning" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
