import Link from "next/link";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-full">
      <header className="helion-rule bg-[#f1f1f3]">
        <div className="flex h-14 items-center px-6">
          <Link href="/dashboard" className="text-sm tracking-[0.22em] text-[#121214]">
            HELION INTELLIGENCE
          </Link>
        </div>
      </header>
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <aside className="hidden w-[84px] border-r border-[#d5d5d9] bg-[#efeff1] px-3 py-4 lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-2">
            {["⌂", "◫", "✧", "☰"].map((item) => (
              <button
                key={item}
                type="button"
                className="flex h-9 w-9 items-center justify-center border border-[#d2d2d6] text-xs text-[#4f4f54] transition hover:bg-[#e4e4e8]"
              >
                {item}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9d9dd] text-[0.62rem] text-[#3f3f44]">
              ME
            </div>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center border border-[#d2d2d6] text-xs text-[#4f4f54] transition hover:bg-[#e4e4e8]"
            >
              ↪
            </button>
          </div>
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
