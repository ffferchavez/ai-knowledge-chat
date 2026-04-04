"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

import { AppSidebar } from "@/components/app/app-sidebar";
import { MAIN_PAD, PAGE_INSET } from "@/lib/ui/shell";

function MenuIcon() {
  return (
    <svg
      className="size-[22px]"
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AppSidebarPlaceholder() {
  return (
    <aside
      className="relative hidden h-full min-h-0 w-[76px] shrink-0 flex-col border-r border-neutral-200/80 bg-[#fafafa] md:flex"
      aria-hidden
    />
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const shellReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <div
      className="flex min-h-[100dvh] min-h-screen flex-1 flex-col bg-[#fafafa]"
      suppressHydrationWarning
    >
      <header
        className="public-header-safe-top shrink-0 border-b border-neutral-200/80 bg-white"
        suppressHydrationWarning
      >
        <div
          className={`${PAGE_INSET} flex flex-wrap items-center justify-between gap-x-4 gap-y-3 py-3 sm:gap-x-6 sm:py-4`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4 md:flex-none md:gap-6">
            {shellReady ? (
              <>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 md:hidden"
                  aria-label="Open menu"
                >
                  <MenuIcon />
                </button>
                <Link
                  href="/dashboard"
                  className="inline-flex min-h-[44px] items-center gap-2 font-sans text-sm uppercase tracking-[0.14em] sm:gap-2.5 sm:text-base"
                >
                  <span className="font-normal text-neutral-950">Helion</span>
                  <span className="font-bold text-neutral-950">Intelligence</span>
                </Link>
              </>
            ) : (
              <>
                <div className="inline-flex size-11 shrink-0 md:hidden" aria-hidden />
                <div
                  className="inline-flex min-h-[44px] min-w-[10rem] items-center rounded-sm bg-neutral-100/90 sm:min-h-[44px]"
                  aria-hidden
                />
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1">
        {shellReady ? (
          <AppSidebar
            mobileOpen={mobileNavOpen}
            onMobileOpenChange={setMobileNavOpen}
            displayName="Manuel Fernando"
            initials="MF"
          />
        ) : (
          <AppSidebarPlaceholder />
        )}
        <main
          className={`relative z-0 flex w-full min-w-0 flex-1 flex-col overflow-auto ${PAGE_INSET} ${MAIN_PAD}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
