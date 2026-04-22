import Link from "next/link";
import type { Metadata } from "next";

import { siteConfig } from "@/lib/config";
import { getWorkspaceSnapshot } from "@/lib/workspace";

export const metadata: Metadata = {
  title: `Dashboard — ${siteConfig.name}`,
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
        <header className="glass-panel w-full p-6 sm:p-8">
          <h1 className="text-2xl font-medium tracking-[-0.03em] text-ui-ink-deep">
            Workspace unavailable
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ui-muted">
            We couldn&apos;t load your workspace. Wait a moment and refresh the
            page, or sign out and sign back in.
          </p>
        </header>
      </div>
    );
  }

  const rows = [
    {
      href: "/knowledge" as const,
      kicker: "Sources",
      title: "Add what the assistant should know",
      body: "Upload files, paste text, or link a public web page.",
    },
    {
      href: "/chat" as const,
      kicker: "Chat",
      title: "Ask questions in plain language",
      body: "Replies include references back to your sources when possible.",
    },
    {
      href: "/saved" as const,
      kicker: "Saved",
      title: "Pick up where you left off",
      body: "Open earlier chats and keep the same thread going.",
    },
  ] as const;

  return (
    <div className="flex w-full min-w-0 flex-col">
      <header className="glass-panel w-full p-6 sm:p-8">
        <p className="ui-kicker">
          Workspace
        </p>
        <h1 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-ui-ink-deep sm:mt-4 sm:text-3xl md:text-4xl">
          {greetingLine(snap.profile.full_name, snap.profile.email)}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ui-muted sm:mt-6 sm:text-base">
          <span className="font-medium text-ui-ink-deep">{snap.organization.name}</span>
          {" · "}
          {snap.knowledgeBase.name}. Add sources, chat, and revisit saved
          conversations from one place.
        </p>
        <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2">
          <div className="glass-muted min-h-[100px] px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">
              Files
            </p>
            <p className="mt-2 text-2xl font-medium tabular-nums tracking-tight text-ui-ink-deep sm:text-3xl">
              {snap.counts.documents}
            </p>
          </div>
          <div className="glass-muted min-h-[100px] px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">
              Chat sessions
            </p>
            <p className="mt-2 text-2xl font-medium tabular-nums tracking-tight text-ui-ink-deep sm:text-3xl">
              {snap.counts.chatSessions}
            </p>
          </div>
        </div>
      </header>

      <nav className="glass-panel mt-4 w-full p-4 sm:p-6" aria-label="Workspace">
        {rows.map((row) => (
          <Link
            key={row.title}
            href={row.href}
            className="group flex w-full min-w-0 items-start justify-between gap-4 border-b border-ui-line py-6 transition-colors hover:bg-white/5 sm:gap-8 sm:py-8"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim">
                {row.kicker}
              </p>
              <p className="mt-2 text-lg font-medium tracking-[-0.02em] text-ui-ink-deep sm:mt-3 sm:text-xl md:text-2xl">
                {row.title}
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ui-muted sm:mt-3">
                {row.body}
              </p>
            </div>
            <span
              className="shrink-0 pt-0.5 text-2xl font-extralight leading-none text-ui-muted transition-colors group-hover:text-ui-ink-deep sm:pt-1 sm:text-3xl"
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
