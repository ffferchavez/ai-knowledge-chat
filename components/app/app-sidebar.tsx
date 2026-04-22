"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { signOutAction } from "@/app/(app)/actions";
import { useMediaQuery } from "@/hooks/use-media-query";

function HomeIcon() {
  return (
    <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SourcesIcon() {
  return (
    <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6a2 2 0 0 1 2-2h8l6 6v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 4v6h6" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H6l-3 3v-6.5A8.5 8.5 0 1 1 21 11.5Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SavedIcon() {
  return (
    <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 4h10a1 1 0 0 1 1 1v15l-6-3-6 3V5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7ZM4.5 9.5H2.6a1 1 0 0 0-1 1v1.9a1 1 0 0 0 1 1h1.9M19.5 9.5h1.9a1 1 0 0 1 1 1v1.9a1 1 0 0 1-1 1h-1.9M7.5 4.5l-.95-1.65a1 1 0 0 0-1.36-.36l-1.65.95a1 1 0 0 0-.37 1.36l.95 1.65M16.5 19.5l.95 1.65a1 1 0 0 0 1.36.36l1.65-.95a1 1 0 0 0 .37-1.36l-.95-1.65M16.5 4.5l.95-1.65a1 1 0 0 1 1.36-.36l1.65.95a1 1 0 0 1 .37 1.36l-.95 1.65M7.5 19.5l-.95 1.65a1 1 0 0 1-1.36.36l-1.65-.95a1 1 0 0 1-.37-1.36l.95-1.65"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function CloseIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 6 6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const items = [
  { href: "/dashboard", label: "Home", Icon: HomeIcon },
  { href: "/knowledge", label: "Sources", Icon: SourcesIcon },
  { href: "/chat", label: "Chat", Icon: ChatIcon },
  { href: "/saved", label: "Saved", Icon: SavedIcon },
] as const;

const navLinkFocus =
  "outline-none focus-visible:ring-2 focus-visible:ring-ui-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNavLinks({
  collapsed,
  isDesktop,
  onNavigate,
}: {
  collapsed: boolean;
  isDesktop: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const iconOnly = collapsed && isDesktop;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!iconOnly && (
        <p className="px-3 pb-2 pt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-ui-muted-dim">
          Workspace
        </p>
      )}
      <nav className="flex flex-col gap-1 px-2 pb-3" aria-label="Main">
        {items.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              title={iconOnly ? label : undefined}
              className={[
                navLinkFocus,
                "group relative flex min-h-[44px] items-center gap-3 rounded-none px-3 py-2.5 text-[13px] font-medium tracking-wide transition-[background-color,color,box-shadow] duration-200",
                iconOnly ? "justify-center px-2" : "",
                active
                  ? "glass-muted text-ui-ink-deep shadow-sm ring-1 ring-ui-glass-ring"
                  : "text-ui-muted hover:bg-white/8 hover:text-ui-ink-deep",
              ].join(" ")}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-none bg-ui-accent"
                  aria-hidden
                />
              )}
              <Icon />
              {!iconOnly && (
                <span className="min-w-0 truncate leading-snug">{label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function SidebarUserFooter({
  displayName,
  initials,
  collapsed,
  isDesktop,
  mobile,
}: {
  displayName: string;
  initials: string;
  collapsed: boolean;
  isDesktop: boolean;
  mobile?: boolean;
}) {
  const iconOnly = collapsed && isDesktop;
  const shortLabel = displayName.trim() || "Account";
  const safe = (initials || "MF").slice(0, 2).toUpperCase();
  const bottomSafe = mobile
    ? "pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    : "";

  if (iconOnly) {
    return (
      <div
        className={`shrink-0 border-t border-ui-line/70 bg-ui-glass-panel ${bottomSafe}`}
      >
        <div className="flex flex-col items-center gap-2 px-2 py-3">
          <button
            type="button"
            className={`${navLinkFocus} glass-muted inline-flex size-10 items-center justify-center rounded-none text-[11px] font-semibold text-ui-text ring-1 ring-ui-line`}
            title={shortLabel}
            aria-label="Account"
          >
            {safe}
          </button>
          <div className="flex flex-col items-center gap-1">
            <Link
              href="/settings"
              className={`${navLinkFocus} inline-flex size-10 items-center justify-center rounded-none text-ui-muted transition-colors hover:bg-white/10 hover:text-ui-text hover:shadow-sm`}
              aria-label="Account settings"
            >
              <SettingsIcon />
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className={`${navLinkFocus} inline-flex size-10 items-center justify-center rounded-none text-ui-muted transition-colors hover:bg-white/10 hover:text-ui-text`}
                aria-label="Log out"
              >
                <LogOutIcon />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`shrink-0 border-t border-ui-line/70 bg-ui-glass-panel ${bottomSafe}`}
    >
      <div className="p-3">
        <div className="glass-muted rounded-none p-3">
          <div className="flex gap-3">
            <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-none bg-white/10 text-[11px] font-semibold tracking-tight text-ui-text ring-1 ring-ui-line">
              {safe}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-tight text-ui-text">
                {shortLabel}
              </p>
              <div className="mt-3 flex flex-col gap-0.5 border-t border-ui-line-soft pt-3">
                <Link
                  href="/settings"
                  className={`${navLinkFocus} inline-flex min-h-10 items-center gap-2 rounded-none px-1 text-[13px] font-medium text-ui-muted transition-colors hover:text-ui-text`}
                >
                  <SettingsIcon />
                  Account
                </Link>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className={`${navLinkFocus} inline-flex min-h-10 w-full items-center gap-2 px-1 text-left text-[13px] font-medium tracking-wide text-ui-muted transition-colors hover:text-ui-text`}
                  >
                    <LogOutIcon />
                    Log out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar({
  mobileOpen,
  onMobileOpenChange,
  displayName,
  initials,
}: {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  displayName: string;
  initials: string;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [desktopExpanded, setDesktopExpanded] = useState(false);

  useEffect(() => {
    if (!isDesktop) return;
    onMobileOpenChange(false);
  }, [isDesktop, onMobileOpenChange]);

  const pathname = usePathname();
  useEffect(() => {
    onMobileOpenChange(false);
  }, [pathname, onMobileOpenChange]);

  useEffect(() => {
    if (!mobileOpen || isDesktop) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen, isDesktop]);

  return (
    <div className="contents" suppressHydrationWarning>
      <aside
        onMouseEnter={() => setDesktopExpanded(true)}
        onMouseLeave={() => setDesktopExpanded(false)}
        className={[
          "relative hidden h-full min-h-0 shrink-0 flex-col border-r border-ui-line/70 bg-ui-glass-panel transition-[width,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:flex",
          desktopExpanded ? "w-[248px] shadow-[6px_0_30px_rgba(0,0,0,0.25)]" : "w-[76px]",
        ].join(" ")}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]">
          <SidebarNavLinks
            collapsed={!desktopExpanded}
            isDesktop={isDesktop}
            onNavigate={() => undefined}
          />
        </div>
        <SidebarUserFooter
          displayName={displayName}
          initials={initials}
          collapsed={!desktopExpanded}
          isDesktop={isDesktop}
        />
      </aside>

      <div
        className={`fixed inset-0 z-40 bg-black/35 backdrop-blur-[4px] transition-opacity duration-300 md:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!mobileOpen}
        onClick={() => onMobileOpenChange(false)}
      />
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[min(300px,90vw)] max-w-full flex-col border-r border-ui-line/70 bg-ui-glass-panel shadow-[8px_0_40px_rgba(0,0,0,0.4)] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ui-line/70 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-ui-muted-dim">
              Menu
            </p>
            <p className="mt-0.5 truncate text-[13px] font-semibold text-ui-text">
              {displayName || "Account"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onMobileOpenChange(false)}
            className={`${navLinkFocus} inline-flex size-11 shrink-0 items-center justify-center rounded-none text-ui-muted transition-colors hover:bg-white/10 hover:text-ui-text`}
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]">
          <SidebarNavLinks
            collapsed={false}
            isDesktop={false}
            onNavigate={() => onMobileOpenChange(false)}
          />
        </div>
        <SidebarUserFooter
          displayName={displayName}
          initials={initials}
          collapsed={false}
          isDesktop={false}
          mobile
        />
      </aside>
    </div>
  );
}
