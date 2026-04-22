"use client";
/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

import { useChatSpeechInput } from "@/hooks/use-chat-speech-input";

function IconCopy({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <rect x={9} y={9} width={13} height={13} rx={0} />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

function IconMic({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v3M8 22h8" />
    </svg>
  );
}

function IconImage({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <rect x={3} y={3} width={18} height={18} rx={2} />
      <circle cx={8.5} cy={8.5} r={1.5} />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function IconChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconMessageSquare({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconSidebarList({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="18" rx="1" />
      <path d="M14 8h7M14 12h7M14 16h7" />
    </svg>
  );
}

function IconBookOpen({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconSend({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 2 11 13" />
      <path d="M22 2 2 12l9 2 2 9 9-11V2z" />
    </svg>
  );
}

function IconMessageCircle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={40}
      height={40}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

const SIDEBAR_STORAGE_KEY = "ai-knowledge-chat-sidebar";
const COMPOSER_MIN_PX = 40;
const COMPOSER_MAX_PX = 120;
const MAX_PENDING_IMAGES = 6;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

type ImageAttachment = { mime: string; data: string };

function readFileAsBase64Part(file: File): Promise<ImageAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") return reject(new Error("read"));
      const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(result);
      if (!m) return reject(new Error("parse"));
      resolve({ mime: m[1], data: m[2] });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // noop
  }
}

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
  attachments?: ImageAttachment[] | null;
};

type Session = {
  id: string;
  title: string | null;
  updated_at: string;
};

function embedCitationLinks(markdown: string): string {
  return markdown.replace(/\[(\d+)\](?!\()/g, "[$1](cite:$1)");
}

function useAssistantMarkdownComponents(
  onCitationClick: (id: number) => void,
): Components {
  return useMemo(
    () => ({
      a: ({ href, children, ...rest }) => {
        if (href?.startsWith("cite:")) {
          const id = Number(href.replace(/^cite:/, ""));
          if (!Number.isFinite(id)) return <span>{children}</span>;
          return (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onCitationClick(id);
              }}
              className="mx-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center border border-ui-line bg-ui-surface px-1.5 align-baseline text-[10px] font-semibold tabular-nums text-ui-muted transition-colors hover:bg-ui-surface-hover hover:text-ui-ink-deep"
              title={`Source ${id}`}
            >
              {id}
            </button>
          );
        }
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ui-accent underline decoration-ui-line underline-offset-2 hover:text-ui-accent-hover"
            {...rest}
          >
            {children}
          </a>
        );
      },
      p: ({ children }) => (
        <p className="mb-3 last:mb-0 [&:first-child]:mt-0">{children}</p>
      ),
      ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
      ol: ({ children }) => (
        <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
      ),
      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
      strong: ({ children }) => (
        <strong className="font-semibold text-ui-ink-deep">{children}</strong>
      ),
      em: ({ children }) => <em className="italic">{children}</em>,
      code: ({ className, children, ...props }) => {
        const isBlock = className?.includes("language-");
        if (isBlock) {
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        }
        return (
          <code className="bg-ui-surface px-1.5 py-0.5 font-mono text-[0.9em] text-ui-ink-deep">
            {children}
          </code>
        );
      },
      pre: ({ children }) => (
        <pre className="my-3 overflow-x-auto border border-ui-line bg-ui-surface p-3 text-sm">
          {children}
        </pre>
      ),
    }),
    [onCitationClick],
  );
}

function AssistantMessageMarkdown({
  text,
  onCitationClick,
}: {
  text: string;
  onCitationClick: (id: number) => void;
}) {
  const components = useAssistantMarkdownComponents(onCitationClick);
  const processed = embedCitationLinks(text);
  return (
    <div className="text-[15px] leading-[1.65] text-ui-text [&_a]:inline">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
        urlTransform={(url) => (url.startsWith("cite:") ? url : defaultUrlTransform(url))}
      >
        {processed}
      </ReactMarkdown>
    </div>
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
  const [rewindFromMessageId, setRewindFromMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImages, setPendingImages] = useState<Array<{ id: string } & ImageAttachment>>(
    [],
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const appendTranscript = useCallback((fragment: string) => {
    const f = fragment.trim();
    if (!f) return;
    setQuestion((prev) => {
      if (!prev) return f;
      const gap = prev.endsWith(" ") || prev.endsWith("\n") ? "" : " ";
      return `${prev}${gap}${f}`;
    });
  }, []);
  const speech = useChatSpeechInput(appendTranscript);

  const addImageFiles = useCallback(async (list: FileList | File[]) => {
    const files = Array.from(list).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    const collected: Array<{ id: string } & ImageAttachment> = [];
    for (const file of files) {
      if (file.size > MAX_IMAGE_BYTES) continue;
      try {
        const part = await readFileAsBase64Part(file);
        collected.push({ id: crypto.randomUUID(), ...part });
      } catch {
        // skip
      }
    }
    if (!collected.length) return;
    setPendingImages((prev) => {
      const room = MAX_PENDING_IMAGES - prev.length;
      if (room <= 0) return prev;
      return [...prev, ...collected.slice(0, room)];
    });
  }, []);

  useEffect(() => {
    try {
      const v = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (v === "0") setSidebarOpen(false);
      else if (v === "1") setSidebarOpen(true);
      else if (
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 767px)").matches
      ) {
        setSidebarOpen(false);
      }
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarOpen ? "1" : "0");
    } catch {
      // noop
    }
  }, [sidebarOpen]);

  const adjustTextareaHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(Math.max(ta.scrollHeight, COMPOSER_MIN_PX), COMPOSER_MAX_PX)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [question, adjustTextareaHeight]);

  useEffect(() => {
    setSessions(initialSessions);
    setMessages(initialMessages);
    setFocusedSourceKey(null);
  }, [initialSessions, initialMessages, initialSessionId]);

  const routeSessionId = initialSessionId;

  const closeSidebarOnMobile = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches
    ) {
      setSidebarOpen(false);
    }
  }, []);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      if (!window.confirm("Delete this chat? This cannot be undone.")) return;
      const res = await fetch(`/api/chat/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) return;
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (routeSessionId === sessionId) {
        setMessages([]);
        setFocusedSourceKey(null);
        setQuestion("");
        setRewindFromMessageId(null);
        router.push("/chat");
      } else {
        setMessages((prev) => prev.filter((m) => m.session_id !== sessionId));
      }
      router.refresh();
    },
    [routeSessionId, router],
  );

  const visibleMessages = useMemo(
    () => (routeSessionId ? messages.filter((m) => m.session_id === routeSessionId) : []),
    [messages, routeSessionId],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visibleMessages.length, pending]);

  async function sendQuestion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const q = question.trim();
    const imagePayload = pendingImages.map(({ mime, data }) => ({ mime, data }));
    if (!q && imagePayload.length === 0) return;
    speech.stop();
    const rewindId = rewindFromMessageId;
    setPending(true);

    try {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        session_id: routeSessionId ?? "pending",
        role: "user",
        content: q || "(Image)",
        citations: null,
        created_at: new Date().toISOString(),
        attachments: imagePayload.length > 0 ? imagePayload : null,
      };
      if (routeSessionId) {
        if (rewindId) {
          setMessages((prev) => {
            const sid = routeSessionId;
            const sessionMsgs = prev.filter((m) => m.session_id === sid);
            const rest = prev.filter((m) => m.session_id !== sid);
            const idx = sessionMsgs.findIndex((m) => m.id === rewindId);
            const kept = idx === -1 ? sessionMsgs : sessionMsgs.slice(0, idx);
            return [...rest, ...kept, userMsg];
          });
        } else {
          setMessages((prev) => [...prev, userMsg]);
        }
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          sessionId: routeSessionId,
          ...(imagePayload.length ? { images: imagePayload } : {}),
          ...(rewindId && routeSessionId ? { rewindFromMessageId: rewindId } : {}),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        sessionId?: string;
        answer?: string;
        citations?: Message["citations"];
      };
      if (!res.ok || !body.sessionId || !body.answer) {
        setError(typeof body.error === "string" ? body.error : "Chat failed.");
        router.refresh();
        return;
      }

      setQuestion("");
      setPendingImages([]);
      setRewindFromMessageId(null);
      const sessionId = body.sessionId;
      if (!routeSessionId) {
        router.push(`/chat/${sessionId}`);
        setMessages((prev) => [...prev, { ...userMsg, session_id: sessionId }]);
        setSessions((prev) => {
          const withoutCurrent = prev.filter((s) => s.id !== sessionId);
          return [{ id: sessionId, title: (q || "Image").slice(0, 72), updated_at: new Date().toISOString() }, ...withoutCurrent];
        });
      } else {
        setSessions((prev) => {
          const current = prev.find((s) => s.id === sessionId);
          const rest = prev.filter((s) => s.id !== sessionId);
          if (!current) return prev;
          return [{ ...current, updated_at: new Date().toISOString() }, ...rest];
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
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="glass-panel mt-4 flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden md:flex-row">
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[4px] transition-opacity md:hidden"
          aria-label="Close chat list"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <aside
        aria-hidden={!sidebarOpen}
        className={[
          "flex shrink-0 flex-col overflow-hidden border-ui-line bg-ui-glass-panel transition-[transform,max-height,width,min-width] duration-200 ease-out",
          "max-md:fixed max-md:left-0 max-md:top-0 max-md:z-50 max-md:h-[100dvh] max-md:max-h-none max-md:w-[min(88vw,300px)] max-md:border-r max-md:border-ui-line max-md:shadow-[4px_0_24px_-4px_rgba(0,0,0,0.45)] max-md:pt-[env(safe-area-inset-top)]",
          sidebarOpen
            ? "max-md:translate-x-0 max-md:pointer-events-auto"
            : "max-md:pointer-events-none max-md:-translate-x-full",
          "md:relative md:inset-auto md:z-auto md:h-auto md:translate-x-0 md:shadow-none md:pt-0 md:border-b-0 md:border-r md:border-ui-line",
          sidebarOpen
            ? "md:max-h-none md:min-h-0 md:w-[min(280px,100%)] md:min-w-[200px] md:max-w-[280px] md:self-stretch"
            : "md:pointer-events-none md:max-h-none md:min-h-0 md:w-0 md:min-w-0 md:max-w-0 md:border-0 md:self-stretch",
        ].join(" ")}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 px-2 pt-2 md:px-3 md:pt-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="inline-flex size-10 shrink-0 items-center justify-center text-ui-muted transition-colors hover:bg-white/10 hover:text-ui-ink-deep md:size-auto md:p-1.5"
              title="Close chat list"
              aria-label="Close chat list"
              aria-expanded={sidebarOpen}
            >
              <IconX className="size-[18px] md:hidden" />
              <IconChevronLeft className="hidden size-4 md:block" />
            </button>
            <span className="inline-flex min-w-0 items-center gap-1.5 text-ui-muted-dim" title="Chats">
              <IconMessageSquare className="size-5 shrink-0 md:hidden" />
              <span className="hidden truncate text-[11px] font-medium md:inline">Chats</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setFocusedSourceKey(null);
              setError(null);
              setQuestion("");
              setRewindFromMessageId(null);
              setMessages([]);
              closeSidebarOnMobile();
              router.push("/chat");
            }}
            className="ui-btn inline-flex size-10 shrink-0 border-ui-line bg-ui-surface text-ui-text shadow-sm md:h-auto md:w-auto md:px-2.5 md:py-1"
            title="New chat"
            aria-label="New chat"
          >
            <IconPlus className="size-[18px] md:hidden" />
            <span className="hidden text-xs font-medium md:inline">New chat</span>
          </button>
        </div>
        <div className="mt-2 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] [scrollbar-gutter:stable] md:mt-2 md:px-3 md:pb-4">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-1 py-4 text-center md:items-start md:py-0 md:text-left">
              <IconMessageSquare className="mx-auto size-8 text-ui-muted-dim md:mx-0 md:hidden" />
              <p className="text-xs leading-relaxed text-ui-muted">
                <span className="md:hidden">Nothing here yet - tap + above.</span>
                <span className="hidden md:inline">No chats yet.</span>
              </p>
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={[
                  "group grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center",
                  routeSessionId === s.id ? "bg-white/10" : "hover:bg-white/5",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() => {
                    closeSidebarOnMobile();
                    router.push(`/chat/${s.id}`);
                  }}
                  className={[
                    "min-w-0 overflow-hidden px-2.5 py-1.5 text-left text-xs leading-snug transition-colors",
                    routeSessionId === s.id
                      ? "font-medium text-ui-ink-deep"
                      : "text-ui-muted hover:text-ui-ink-deep",
                  ].join(" ")}
                >
                  <span className="block w-full truncate">{s.title || "Untitled"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void deleteSession(s.id);
                  }}
                  className="flex h-full shrink-0 items-center justify-center px-1.5 text-ui-muted-dim opacity-100 transition-colors hover:bg-white/10 hover:text-ui-ink-deep md:opacity-0 md:group-hover:opacity-100"
                  title="Delete chat"
                  aria-label="Delete chat"
                >
                  <IconTrash className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
        {!sidebarOpen ? (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="ui-btn absolute left-2 top-2 z-10 flex items-center justify-center border-ui-line bg-ui-surface text-ui-text shadow-sm transition-colors hover:bg-ui-surface-hover sm:left-3 sm:top-3 max-md:!left-[max(0.5rem,env(safe-area-inset-left))] max-md:!top-[max(0.5rem,env(safe-area-inset-top))] max-md:size-12 max-md:bg-ui-glass-panel md:gap-1.5 md:px-2 md:py-1.5 md:text-[11px] md:font-medium"
            title="Open chat list"
            aria-expanded={false}
            aria-label="Open chat list"
          >
            <IconSidebarList className="size-6 shrink-0 md:hidden" />
            <IconChevronRight className="hidden size-4 shrink-0 md:inline" />
            <span className="hidden md:inline">Chats</span>
          </button>
        ) : null}
        <div
          ref={scrollRef}
          className={[
            "min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-2 sm:px-6 sm:py-3",
            !sidebarOpen ? "pt-12 sm:pt-14" : "",
          ].join(" ")}
        >
          {visibleMessages.length === 0 && !pending ? (
            <div className="mx-auto flex min-h-[12rem] max-w-2xl flex-col items-center justify-center px-2 py-8 text-center sm:min-h-[16rem]">
              <IconMessageCircle className="mb-3 text-ui-muted-dim md:hidden" />
              <p className="text-base font-medium text-ui-ink-deep md:font-normal md:text-base md:text-ui-muted">
                <span className="md:hidden">Ask below</span>
                <span className="hidden md:inline">Ask anything below to begin</span>
              </p>
            </div>
          ) : (
            visibleMessages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="group flex justify-end">
                  <div className="flex max-w-[min(85%,36rem)] flex-col items-end gap-1">
                    <div className="glass-elevated px-4 py-3 text-[15px] leading-relaxed text-ui-ink-deep shadow-sm">
                      {m.attachments?.length ? (
                        <div className={m.content === "(Image)" ? "flex flex-col gap-2" : "mb-2 flex flex-col gap-2"}>
                          {m.attachments.map((att, idx) => (
                            <img
                              key={`${m.id}-att-${idx}`}
                              src={`data:${att.mime};base64,${att.data}`}
                              alt=""
                              className="max-h-48 w-full max-w-sm border border-ui-line object-contain"
                            />
                          ))}
                        </div>
                      ) : null}
                      {m.content === "(Image)" && m.attachments?.length ? null : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>
                    <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(m.content)}
                        className="p-1.5 text-ui-muted transition-colors hover:bg-white/10 hover:text-ui-ink-deep"
                        title="Copy"
                        aria-label="Copy message"
                      >
                        <IconCopy className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setQuestion(m.content);
                          setRewindFromMessageId(m.id);
                          textareaRef.current?.focus();
                        }}
                        className="p-1.5 text-ui-muted transition-colors hover:bg-white/10 hover:text-ui-ink-deep"
                        title="Edit"
                        aria-label="Edit message"
                      >
                        <IconPencil className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={m.id} className="group flex justify-start">
                  <div className="w-full max-w-[min(92%,42rem)] space-y-2">
                    <div className="glass-muted relative px-4 py-3 pr-10 shadow-sm">
                      <AssistantMessageMarkdown
                        text={m.content}
                        onCitationClick={(id) => {
                          const key = `${m.id}-${id}`;
                          setFocusedSourceKey(key);
                          const el = document.getElementById(`source-${key}`);
                          if (el) {
                            el.scrollIntoView({ behavior: "smooth", block: "center" });
                            const details = el.closest("details");
                            if (details && !details.open) details.open = true;
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(m.content)}
                        className="absolute right-1.5 top-1.5 p-1.5 text-ui-muted-dim opacity-100 transition-colors hover:bg-white/10 hover:text-ui-ink-deep sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                        title="Copy"
                        aria-label="Copy reply"
                      >
                        <IconCopy className="size-4" />
                      </button>
                    </div>
                    {m.citations?.length ? (
                      <details className="border border-transparent bg-transparent">
                        <summary className="flex cursor-pointer list-none items-center gap-2 py-1.5 text-xs text-ui-muted transition-colors marker:content-none hover:text-ui-ink-deep md:py-1 [&::-webkit-details-marker]:hidden">
                          <span className="inline-flex items-center gap-2 rounded-full border border-ui-line bg-ui-surface px-2.5 py-1.5 text-[12px] font-medium text-ui-muted shadow-sm md:gap-1.5 md:px-2 md:py-0.5 md:text-[11px] md:font-medium md:text-ui-muted">
                            <IconBookOpen className="size-4 shrink-0 text-ui-muted md:hidden" />
                            <span className="tabular-nums md:hidden">{m.citations.length}</span>
                            <span className="hidden md:inline">
                              {m.citations.length} source{m.citations.length === 1 ? "" : "s"}
                            </span>
                          </span>
                          <span className="text-ui-muted-dim" title="Expand">
                            <IconChevronDown className="size-4 md:hidden" />
                          </span>
                        </summary>
                        <div className="mt-2 space-y-1 border-t border-ui-line-soft pt-2">
                          {m.citations.map((c) => (
                            <div
                              key={`${m.id}-${c.id}`}
                              id={`source-${m.id}-${c.id}`}
                              className={[
                                "px-2 py-2 transition-colors",
                                focusedSourceKey === `${m.id}-${c.id}`
                                  ? "bg-ui-accent-muted ring-1 ring-ui-accent/60"
                                  : "bg-ui-surface hover:bg-ui-surface-hover",
                              ].join(" ")}
                            >
                              <p className="text-[11px] font-medium text-ui-ink-deep">
                                <span className="mr-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center bg-ui-surface-hover text-[10px] font-semibold text-ui-muted">
                                  {c.id}
                                </span>
                                <span className="break-all">{c.filename}</span>
                              </p>
                              <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-ui-muted">
                                {c.excerpt}
                              </p>
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </div>
                </div>
              ),
            )
          )}
          {pending ? (
            <div className="flex justify-start">
              <div className="glass-muted px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 animate-pulse bg-ui-muted [animation-delay:0ms]" />
                  <span className="size-2 animate-pulse bg-ui-muted [animation-delay:150ms]" />
                  <span className="size-2 animate-pulse bg-ui-muted [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-ui-line/70 bg-transparent p-2 sm:p-3">
          {rewindFromMessageId ? (
            <div className="glass-muted mx-auto mb-2 flex max-w-3xl flex-col gap-2 px-3 py-2.5 text-xs leading-relaxed text-ui-muted sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2 sm:py-2">
              <span>
                Edit mode - send replaces this message and the reply under it.
              </span>
              <button
                type="button"
                onClick={() => setRewindFromMessageId(null)}
                className="ui-btn inline-flex min-h-0 items-center justify-center gap-1 px-2 py-2 text-[11px] uppercase tracking-wide md:py-1"
                title="Cancel editing"
                aria-label="Cancel editing"
              >
                <IconX className="size-4" />
              </button>
            </div>
          ) : null}

          <form
            onSubmit={sendQuestion}
            onDragOver={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
            }}
            onDrop={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              void addImageFiles(ev.dataTransfer.files);
            }}
            className="glass-elevated mx-auto flex w-full max-w-3xl flex-col gap-1.5 p-2 shadow-sm focus-within:border-ui-accent/70 focus-within:ring-2 focus-within:ring-ui-accent/30"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              multiple
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(ev) => {
                const list = ev.target.files;
                if (list?.length) void addImageFiles(list);
                ev.target.value = "";
              }}
            />
            {pendingImages.length > 0 ? (
              <div className="flex flex-wrap gap-2 px-1">
                {pendingImages.map((img) => (
                  <div key={img.id} className="relative inline-flex">
                    <img
                      src={`data:${img.mime};base64,${img.data}`}
                      alt=""
                      className="h-12 w-12 border border-ui-line object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPendingImages((p) => p.filter((x) => x.id !== img.id))}
                      className="absolute -right-1 -top-1 flex size-5 items-center justify-center border border-ui-line bg-ui-surface text-ui-muted shadow-sm hover:bg-ui-surface-hover"
                      aria-label="Remove image"
                    >
                      <IconX className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="flex w-full min-w-0 items-end gap-1">
              <textarea
                ref={textareaRef}
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  requestAnimationFrame(() => adjustTextareaHeight());
                }}
                onPaste={(ev) => {
                  const files = ev.clipboardData?.files;
                  if (files?.length) {
                    ev.preventDefault();
                    void addImageFiles(files);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!pending && (question.trim() || pendingImages.length > 0)) {
                      e.currentTarget.form?.requestSubmit();
                    }
                  }
                }}
                rows={1}
                disabled={pending}
                placeholder="Message..."
                className="min-h-[40px] max-h-[120px] min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-2 py-2 text-[15px] leading-5 text-ui-ink-deep outline-none placeholder:text-ui-muted-dim disabled:opacity-50"
              />
              <div className="flex shrink-0 items-center gap-0.5 self-end pb-0.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={pending || pendingImages.length >= MAX_PENDING_IMAGES}
                  className="p-2 text-ui-muted transition-colors hover:bg-white/10 hover:text-ui-ink-deep disabled:cursor-not-allowed disabled:opacity-40"
                  title="Add images"
                  aria-label="Add images"
                >
                  <IconImage className="size-[18px]" />
                </button>
                {speech.supported ? (
                  <button
                    type="button"
                    onClick={() => speech.toggle()}
                    disabled={pending}
                    className={[
                      "p-2 text-ui-muted transition-colors hover:bg-white/10 hover:text-ui-ink-deep disabled:opacity-40",
                      speech.listening ? "bg-ui-accent-muted text-ui-accent ring-1 ring-ui-accent/60" : "",
                    ].join(" ")}
                    title={speech.listening ? "Stop dictation" : "Dictate (voice to text)"}
                    aria-label={speech.listening ? "Stop dictation" : "Dictate with microphone"}
                    aria-pressed={speech.listening}
                  >
                    <IconMic className="size-[18px]" />
                  </button>
                ) : null}
                <button
                  type="submit"
                  disabled={pending || (!question.trim() && pendingImages.length === 0)}
                  className="ui-btn ui-btn-primary inline-flex min-h-[44px] min-w-[44px] items-center justify-center px-2.5 md:min-h-0 md:min-w-0 md:px-3 md:py-1.5 md:text-[11px] md:font-medium md:uppercase md:tracking-wide"
                  title={pending ? "Sending..." : "Send"}
                  aria-label={pending ? "Sending" : "Send message"}
                >
                  {pending ? "..." : <IconSend className="size-5 md:hidden" />}
                </button>
              </div>
            </div>
          </form>
          {error ? (
            <p className="mx-auto mt-2 max-w-3xl text-sm text-ui-warning" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
