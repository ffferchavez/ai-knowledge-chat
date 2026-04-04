export const metadata = {
  title: "Home — Helion Intelligence",
};

export default function DashboardPage() {
  const rows = [
    {
      kicker: "Sources",
      title: "Set up your source context",
      body: "Files, websites, and source links that guide every answer.",
    },
    {
      kicker: "Chat",
      title: "Start grounded conversations",
      body: "Ask practical business questions and get answer packs with references.",
    },
    {
      kicker: "Saved",
      title: "Review session history",
      body: "Open past sessions with citations and continue from prior context.",
    },
  ] as const;

  return (
    <div className="flex w-full min-w-0 flex-col">
      <header className="w-full border-b border-black pb-8 sm:pb-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-ui-muted-dim">
          Workspace
        </p>
        <h1 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-ui-text sm:mt-4 sm:text-3xl md:text-4xl">
          Hi, Manuel Fernando
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ui-muted sm:mt-6 sm:text-base">
          Set up your company knowledge, index sources, and run grounded Q&amp;A
          from one workspace.
        </p>
        <div className="mt-8 grid w-full grid-cols-1 gap-px bg-black sm:mt-10 sm:grid-cols-2">
          <div className="min-h-[100px] bg-ui-bg px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">
              Sources
            </p>
            <p className="mt-2 text-2xl font-medium tabular-nums tracking-tight text-ui-text sm:text-3xl">
              2
            </p>
          </div>
          <div className="min-h-[100px] bg-ui-bg px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ui-muted-dim">
              Saved packs
            </p>
            <p className="mt-2 text-2xl font-medium tabular-nums tracking-tight text-ui-text sm:text-3xl">
              15
            </p>
          </div>
        </div>
      </header>

      <nav className="mt-0 w-full border-t border-black" aria-label="Workspace">
        {rows.map((row) => (
          <div
            key={row.title}
            className="group flex w-full min-w-0 items-start justify-between gap-4 border-b border-black py-8 transition-colors hover:bg-neutral-50 sm:gap-8 sm:py-10"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim">
                {row.kicker}
              </p>
              <p className="mt-2 text-lg font-medium tracking-[-0.02em] text-ui-text sm:mt-3 sm:text-xl md:text-2xl">
                {row.title}
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ui-muted sm:mt-3">
                {row.body}
              </p>
            </div>
            <span
              className="shrink-0 pt-0.5 text-2xl font-extralight leading-none text-ui-muted transition-colors group-hover:text-ui-text sm:pt-1 sm:text-3xl"
              aria-hidden
            >
              ›
            </span>
          </div>
        ))}
      </nav>
    </div>
  );
}
