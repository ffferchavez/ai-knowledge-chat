export const metadata = {
  title: "Workspace — Helion Intelligence",
};

export default function DashboardPage() {
  return (
    <div className="min-h-full py-10">
      <div className="helion-shell">
        <p className="helion-kicker">Workspace</p>
        <h1 className="mt-3 text-5xl font-medium tracking-tight text-[#101012]">
          Hi, welcome back
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-[#5f5f65]">
          Set up your company knowledge, index sources, and run grounded Q&amp;A
          from one workspace.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <div className="helion-panel p-6">
            <p className="helion-kicker">Sources</p>
            <p className="mt-3 text-4xl">0</p>
          </div>
          <div className="helion-panel p-6">
            <p className="helion-kicker">Chat sessions</p>
            <p className="mt-3 text-4xl">0</p>
          </div>
        </div>

        <div className="mt-12 helion-rule" />
        <div className="grid">
          <div className="flex h-20 items-center justify-between border-b border-[#c8c8cc] pr-1 text-3xl tracking-tight text-[#111114]">
            <span>Set up your sources</span>
            <span className="text-sm text-[#6f6f73]">Coming in Phase 4b</span>
          </div>
          <div className="flex h-20 items-center justify-between border-b border-[#c8c8cc] pr-1 text-3xl tracking-tight text-[#111114]">
            <span>Start a grounded chat</span>
            <span className="text-sm text-[#6f6f73]">Coming in Phase 6</span>
          </div>
        </div>
      </div>
    </div>
  );
}
