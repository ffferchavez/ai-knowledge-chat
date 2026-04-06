"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function WebsiteSourceForm() {
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
        body: JSON.stringify({ url, title }),
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

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
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
          className="mt-2 w-full border border-black bg-white px-3 py-2.5 text-sm text-ui-text outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/15 disabled:opacity-50"
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
          className="mt-2 w-full border border-black bg-white px-3 py-2.5 text-sm text-ui-text outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/15 disabled:opacity-50"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="border border-black bg-ui-text px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add website"}
      </button>
      {error ? (
        <p className="text-sm text-ui-warning" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
