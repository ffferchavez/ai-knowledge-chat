import Link from "next/link";

import { siteConfig } from "@/lib/config";

export const metadata = {
  title: `Dashboard — ${siteConfig.name}`,
};

export default function DashboardPage() {
  return (
    <div className="min-h-full bg-[#050816] px-6 py-12 text-zinc-100">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-400/80">
          {siteConfig.org.city}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 max-w-xl text-zinc-400">
          Authenticated shell, organization summary, and shortcuts land here in
          Phase 3. Routes under{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-cyan-200">
            (app)
          </code>{" "}
          will be protected by middleware in Phase 2.
        </p>
        <ul className="mt-10 space-y-3 text-sm text-zinc-300">
          <li className="flex items-center justify-between rounded-lg border border-white/10 bg-white/3 px-4 py-3">
            <span>Knowledge &amp; documents</span>
            <span className="text-xs text-zinc-500">Coming Phase 4–5</span>
          </li>
          <li className="flex items-center justify-between rounded-lg border border-white/10 bg-white/3 px-4 py-3">
            <span>Chat</span>
            <span className="text-xs text-zinc-500">Coming Phase 6–7</span>
          </li>
        </ul>
        <p className="mt-10">
          <Link href="/" className="text-sm text-cyan-400/90 hover:text-cyan-300">
            ← Marketing home
          </Link>
        </p>
      </div>
    </div>
  );
}
