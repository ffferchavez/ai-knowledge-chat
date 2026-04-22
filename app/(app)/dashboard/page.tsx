import Link from "next/link";
import type { Metadata } from "next";

import { getWorkspaceSnapshot } from "@/lib/workspace";

export const metadata: Metadata = {
  title: "Dashboard — Helion Intelligence",
};

function greetingLine(fullName: string | null, email: string) {
  const trimmed = fullName?.trim();
  if (trimmed) return `Hi, ${trimmed}`;
  const local = email.includes("@") ? email.split("@")[0] : email;
  return `Hi, ${local || "there"}`;
}

export default async function DashboardPage() {
  const snap = await getWorkspaceSnapshot();

  if (!snap) {
    return (
      <div className="flex w-full min-w-0 flex-col">
        <header className="w-full border-b border-helion-ink pb-8 sm:pb-10">
          <h1 className="text-2xl font-medium tracking-[-0.03em] text-ui-text">
            Workspace unavailable
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ui-muted">
            We could not load your organization or knowledge base. If you just
            created your account, confirm Supabase migrations are applied and
            try again.
          </p>
        </header>
      </div>
    );
  }

  const rows = [
    {
      href: "/knowledge" as const,
      kicker: "Sources",
      title: "Set up your source context",
      body: "Files, websites, and source links that guide every answer.",
    },
    {
      href: "/chat" as const,
      kicker: "Chat",
      title: "Start grounded conversations",
      body: "Ask practical business questions and get answer packs with references.",
    },
    {
      href: "/saved" as const,
      kicker: "Saved",
      title: "Review session history",
      body: "Open past sessions with citations and continue from prior context.",
    },
  ] as const;

  return (
    <div className="flex w-full min-w-0 flex-col">
      <header className="w-full border-b border-helion-ink pb-8 sm:pb-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-ui-muted-dim">
          Workspace
        </p>
        <h1 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-ui-text sm:mt-4 sm:text-3xl md:text-4xl">
          {greetingLine(snap.profile.full_name, snap.profile.email)}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ui-muted sm:mt-6 sm:text-base">
          <span className="font-medium text-ui-text">{snap.organization.name}</span>
          {" · "}
          {snap.knowledgeBase.name}. Index sources and run grounded Q&amp;A from
          one place.
        </p>
        <div className="mt-8 grid w-full grid-cols-1 gap-px bg-helion-ink sm:mt-10 sm:grid-cols-2">
          <div className="min-h-[100px] bg-ui-bg px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">
              Files
            </p>
            <p className="mt-2 text-2xl font-medium tabular-nums tracking-tight text-ui-text sm:text-3xl">
              {snap.counts.documents}
            </p>
          </div>
          <div className="min-h-[100px] bg-ui-bg px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">
              Chat sessions
            </p>
            <p className="mt-2 text-2xl font-medium tabular-nums tracking-tight text-ui-text sm:text-3xl">
              {snap.counts.chatSessions}
            </p>
          </div>
        </div>
      </header>

      <nav className="mt-0 w-full border-t border-helion-ink" aria-label="Workspace">
        {rows.map((row) => (
          <Link
            key={row.title}
            href={row.href}
            className="group flex w-full min-w-0 items-start justify-between gap-4 border-b border-helion-ink py-8 transition-colors hover:bg-neutral-50 sm:gap-8 sm:py-10"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim">
                {row.kicker}
              </p>
              <p className="mt-2 text-lg font-medium tracking-[-0.02em] text-ui-text sm:mt-3 sm:text-xl md:text-2xl">
                {row.title}
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ui-muted sm:mt-3">
                {row.body}
              </p>
            </div>
            <span
              className="shrink-0 pt-0.5 text-2xl font-extralight leading-none text-ui-muted transition-colors group-hover:text-ui-text sm:pt-1 sm:text-3xl"
              aria-hidden
            >
              ›
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
