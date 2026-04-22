import Link from "next/link";

import { siteConfig } from "@/lib/config";
import { PAGE_INSET } from "@/lib/ui/shell";

function LogInIcon() {
  return (
    <svg
      className="size-4 shrink-0"
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header
      className="public-header-safe-top glass-panel w-full border-b border-ui-line/70"
      suppressHydrationWarning
    >
      <div
        className={`${PAGE_INSET} flex flex-wrap items-center justify-between gap-3 py-3 sm:gap-4 sm:py-4`}
      >
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 font-sans text-sm font-semibold uppercase tracking-[0.14em] text-ui-ink-deep sm:gap-2.5 sm:text-base"
          aria-label={`${siteConfig.name} home`}
        >
          {siteConfig.name}
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <Link
            href="/login"
            className="ui-btn ui-btn-primary"
          >
            <LogInIcon />
            Log in
          </Link>
        </div>
      </div>
    </header>
  );
}
