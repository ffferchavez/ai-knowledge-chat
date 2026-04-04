import Link from "next/link";

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

function UserPlusIcon() {
  return (
    <svg
      className="size-4 shrink-0 text-white"
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6"
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
      className="public-header-safe-top w-full border-b border-neutral-200/80 bg-white"
      suppressHydrationWarning
    >
      <div
        className={`${PAGE_INSET} flex flex-wrap items-center justify-between gap-3 py-3 sm:gap-4 sm:py-4`}
      >
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 font-sans text-sm uppercase tracking-[0.14em] sm:gap-2.5 sm:text-base"
          aria-label="Helion Intelligence home"
        >
          <span className="font-normal text-neutral-950">Helion</span>
          <span className="font-bold text-neutral-950">Intelligence</span>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 border border-neutral-300 px-4 py-2 text-[13px] font-medium tracking-wide text-neutral-800 transition-colors hover:border-neutral-950 hover:bg-neutral-50"
          >
            <LogInIcon />
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 border border-neutral-950 bg-neutral-950 px-4 py-2 text-[13px] font-medium tracking-wide !text-white transition-colors hover:bg-neutral-800 hover:!text-white"
          >
            <UserPlusIcon />
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
