import Link from "next/link";

import { siteConfig } from "@/lib/config";

export function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-[#050816]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="text-sm font-semibold tracking-tight text-white">
            {siteConfig.name}
          </span>
          <span className="hidden text-xs text-zinc-500 group-hover:text-zinc-400 sm:inline">
            {siteConfig.org.serviceLine}
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/login"
            className="text-zinc-400 transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-cyan-500/15 px-4 py-2 font-medium text-cyan-300 ring-1 ring-cyan-400/30 transition hover:bg-cyan-500/25"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
