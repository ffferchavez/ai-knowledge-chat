import type { ReactNode } from "react";

/** Compact title area so chat thread can fill viewport. */
export function ChatPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
      <header className="glass-panel shrink-0 py-2.5 sm:py-3">
        <div className="flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-baseline md:justify-between md:gap-x-4 md:gap-y-1">
          <div className="min-w-0">
            <p className="ui-kicker">
              Chat
            </p>
            <h1 className="mt-0.5 text-base font-medium tracking-[-0.03em] text-ui-ink-deep sm:text-lg md:text-xl">
              Ask about your content
            </h1>
          </div>
          <p className="hidden max-w-xl text-[11px] leading-snug text-ui-muted sm:text-xs md:block">
            Answers draw from the sources you added. Numbered markers in a reply
            match the source list below it.
          </p>
        </div>
      </header>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
