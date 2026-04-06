"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Message = {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations: Array<{
    id: number;
    filename: string;
    excerpt: string;
  }> | null;
  created_at: string;
};

type Session = {
  id: string;
  title: string | null;
  updated_at: string;
};

function AnchorText({
  text,
  onAnchorClick,
}: {
  text: string;
  onAnchorClick: (id: number) => void;
}) {
  const pieces = text.split(/(\[\d+\])/g);
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-ui-text">
      {pieces.map((piece, idx) => {
        const match = piece.match(/^\[(\d+)\]$/);
        if (!match) return <span key={`${piece}-${idx}`}>{piece}</span>;
        const id = Number(match[1]);
        return (
          <button
            key={`${piece}-${idx}`}
            type="button"
            onClick={() => onAnchorClick(id)}
            className="mx-0.5 inline-flex items-center rounded border border-black/20 bg-ui-bg px-1.5 py-0.5 text-xs font-medium text-ui-text hover:border-black/40"
            title={`Go to source [${id}]`}
          >
            [{id}]
          </button>
        );
      })}
    </p>
  );
}

export function ChatClient({
  initialSessions,
  initialMessages,
  initialSessionId,
}: {
  initialSessions: Session[];
  initialMessages: Message[];
  initialSessionId: string | null;
}) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [messages, setMessages] = useState(initialMessages);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedSourceKey, setFocusedSourceKey] = useState<string | null>(null);

  useEffect(() => {
    setSessions(initialSessions);
    setMessages(initialMessages);
    setFocusedSourceKey(null);
  }, [initialSessions, initialMessages, initialSessionId]);

  const routeSessionId = initialSessionId;

  const visibleMessages = useMemo(
    () =>
      routeSessionId
        ? messages.filter((m) => m.session_id === routeSessionId)
        : [],
    [messages, routeSessionId],
  );

  async function sendQuestion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const q = question.trim();
    if (!q) return;
    setPending(true);
    setQuestion("");

    try {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        session_id: routeSessionId ?? "pending",
        role: "user",
        content: q,
        citations: null,
        created_at: new Date().toISOString(),
      };
      if (routeSessionId) {
        setMessages((prev) => [...prev, userMsg]);
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, sessionId: routeSessionId }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        sessionId?: string;
        answer?: string;
        citations?: Message["citations"];
      };
      if (!res.ok || !body.sessionId || !body.answer) {
        setError(typeof body.error === "string" ? body.error : "Chat failed.");
        return;
      }

      const sessionId = body.sessionId;
      if (!routeSessionId) {
        router.push(`/chat/${sessionId}`);
        setMessages((prev) => [
          ...prev,
          { ...userMsg, session_id: sessionId },
        ]);
        setSessions((prev) => {
          const withoutCurrent = prev.filter((s) => s.id !== sessionId);
          return [
            {
              id: sessionId,
              title: q.slice(0, 72),
              updated_at: new Date().toISOString(),
            },
            ...withoutCurrent,
          ];
        });
      } else {
        setSessions((prev) => {
          const current = prev.find((s) => s.id === sessionId);
          const rest = prev.filter((s) => s.id !== sessionId);
          if (!current) return prev;
          return [
            { ...current, updated_at: new Date().toISOString() },
            ...rest,
          ];
        });
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        role: "assistant",
        content: body.answer,
        citations: body.citations ?? null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-0 grid w-full grid-cols-1 gap-6 border-t border-black pt-8 md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-b border-black pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">
            Sessions
          </p>
          <button
            type="button"
            onClick={() => {
              setFocusedSourceKey(null);
              setError(null);
              setQuestion("");
              setMessages([]);
              router.push("/chat");
            }}
            className="border border-black/30 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-ui-muted transition-colors hover:border-black hover:text-ui-text"
          >
            New Chat
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-1">
          {sessions.length === 0 ? (
            <p className="text-sm text-ui-muted">No sessions yet.</p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  router.push(`/chat/${s.id}`);
                }}
                className={[
                  "w-full border px-3 py-2 text-left text-sm transition-colors",
                  routeSessionId === s.id
                    ? "border-black bg-white text-ui-text"
                    : "border-black/20 text-ui-muted hover:border-black/40 hover:text-ui-text",
                ].join(" ")}
              >
                {s.title || "Untitled session"}
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="min-w-0">
        <div className="min-h-[360px] space-y-4 border border-black/20 bg-white p-4">
          {visibleMessages.length === 0 ? (
            <p className="text-sm text-ui-muted">
              Ask your first question. Answers are grounded in indexed sources.
            </p>
          ) : (
            visibleMessages.map((m) => (
              <article key={m.id} className="space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ui-muted-dim">
                  {m.role}
                </p>
                {m.role === "assistant" ? (
                  <AnchorText
                    text={m.content}
                    onAnchorClick={(id) => {
                      const key = `${m.id}-${id}`;
                      setFocusedSourceKey(key);
                      const el = document.getElementById(`source-${key}`);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                      }
                    }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ui-text">
                    {m.content}
                  </p>
                )}
                {m.role === "assistant" && m.citations?.length ? (
                  <div className="space-y-2">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ui-muted-dim">
                      Sources
                    </p>
                    {m.citations.map((c) => (
                      <div
                        key={`${m.id}-${c.id}`}
                        id={`source-${m.id}-${c.id}`}
                        className={[
                          "rounded border px-2 py-2 text-xs text-ui-muted transition-colors",
                          focusedSourceKey === `${m.id}-${c.id}`
                            ? "border-black/45 bg-[#fffde7]"
                            : "border-black/20 bg-ui-bg",
                        ].join(" ")}
                      >
                        <p className="font-medium text-ui-text">
                          [{c.id}] {c.filename}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                          {c.excerpt}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>

        <form onSubmit={sendQuestion} className="mt-4 space-y-3">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!pending && question.trim()) {
                  e.currentTarget.form?.requestSubmit();
                }
              }
            }}
            rows={4}
            disabled={pending}
            placeholder="Ask a question about your indexed sources..."
            className="w-full resize-y border border-black bg-white px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/15 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={pending}
            className="border border-black bg-ui-text px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white disabled:opacity-50"
          >
            {pending ? "Thinking..." : "Send"}
          </button>
          {error ? (
            <p className="text-sm text-ui-warning" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </section>
    </div>
  );
}
