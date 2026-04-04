import Link from "next/link";

import { siteConfig } from "@/lib/config";

export function SiteHeader() {
  return (
    <header className="helion-rule">
      <div className="helion-shell flex h-14 items-center justify-between">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="text-sm tracking-[0.22em] text-[#121214]">
            HELION INTELLIGENCE
          </span>
          <span className="hidden text-[0.62rem] uppercase tracking-[0.24em] text-[#7b7b81] sm:inline">
            {siteConfig.org.serviceLine}
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/login"
            className="inline-flex h-9 items-center border border-[#c7c7cc] px-4 text-xs text-[#1a1a1d] transition hover:bg-[#e8e8ea]"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="helion-btn-primary inline-flex items-center"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
