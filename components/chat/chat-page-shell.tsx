import type { ReactNode } from "react";

/** Compact title area so chat thread can fill viewport. */
export function ChatPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-black py-2 sm:py-2.5">
        <div className="flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-baseline md:justify-between md:gap-x-4 md:gap-y-1">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-ui-muted-dim">
              Chat
            </p>
            <h1 className="mt-0.5 text-base font-medium tracking-[-0.03em] text-ui-text sm:text-lg md:text-xl">
              Ask about your company
            </h1>
          </div>
          <p className="hidden max-w-xl text-[11px] leading-snug text-ui-muted sm:text-xs md:block">
            Answers use your team&apos;s documents and sites. Numbers in replies link
            to sources.
          </p>
        </div>
      </header>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
