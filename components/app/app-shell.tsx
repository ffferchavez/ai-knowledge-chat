"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { AppSidebar } from "@/components/app/app-sidebar";
import { siteConfig } from "@/lib/config";
import { CHAT_MAIN_PAD, MAIN_PAD, PAGE_INSET } from "@/lib/ui/shell";

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
      className="relative hidden h-full min-h-0 w-[76px] shrink-0 flex-col border-r border-ui-line/70 bg-ui-glass-panel md:flex"
      aria-hidden
    />
  );
}

export function AppShell({
  displayName,
  initials,
  children,
}: {
  displayName: string;
  initials: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatRoute = pathname?.startsWith("/chat") ?? false;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const shellReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!isChatRoute) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.overscrollBehavior = prevBodyOverscroll;
    };
  }, [isChatRoute]);

  return (
    <div
      className={
        isChatRoute
          ? "flex h-[100dvh] max-h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-transparent"
          : "flex min-h-[100dvh] min-h-screen flex-1 flex-col bg-transparent"
      }
      suppressHydrationWarning
    >
      <header
        className="public-header-safe-top glass-panel shrink-0 border-b border-ui-line/70"
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
                  className="inline-flex size-11 shrink-0 items-center justify-center text-ui-muted transition-colors hover:bg-white/10 hover:text-ui-text md:hidden"
                  aria-label="Open menu"
                >
                  <MenuIcon />
                </button>
                <Link
                  href="/dashboard"
                  className="inline-flex min-h-[44px] items-center gap-2 font-sans text-sm font-semibold uppercase tracking-[0.14em] text-ui-ink-deep sm:gap-2.5 sm:text-base"
                >
                  {siteConfig.name}
                </Link>
              </>
            ) : (
              <>
                <div className="inline-flex size-11 shrink-0 md:hidden" aria-hidden />
                <div
                  className="inline-flex min-h-[44px] min-w-[10rem] items-center rounded-sm bg-ui-surface sm:min-h-[44px]"
                  aria-hidden
                />
              </>
            )}
          </div>
        </div>
      </header>

      <div className={`flex min-h-0 min-w-0 flex-1 ${isChatRoute ? "overflow-hidden" : ""}`}>
        {shellReady ? (
          <AppSidebar
            mobileOpen={mobileNavOpen}
            onMobileOpenChange={setMobileNavOpen}
            displayName={displayName}
            initials={initials}
          />
        ) : (
          <AppSidebarPlaceholder />
        )}
        <main
          className={`relative z-0 flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden ${isChatRoute ? "overflow-y-hidden overscroll-none" : "overflow-y-auto"} ${PAGE_INSET} ${isChatRoute ? CHAT_MAIN_PAD : MAIN_PAD}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
