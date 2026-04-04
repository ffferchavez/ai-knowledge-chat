import Link from "next/link";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { PAGE_INSET } from "@/lib/ui/shell";

const howItWorks = [
  "Add your business documents and website pages.",
  "Ask practical questions in natural language.",
  "Get grounded answers with clear references.",
];

export default function Home() {
  return (
    <div
      className="flex min-h-[100dvh] min-h-screen flex-1 flex-col bg-[#fafafa]"
      suppressHydrationWarning
    >
      <SiteHeader />
      <main
        className={`flex min-h-0 flex-1 flex-col pb-12 pt-10 sm:pb-16 sm:pt-14 lg:pt-20 ${PAGE_INSET}`}
      >
        <section className="w-full max-w-4xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-ui-muted-dim">
            Helion Intelligence
          </p>
          <h1 className="mt-5 text-5xl font-medium leading-[1.05] tracking-[-0.035em] text-ui-text sm:mt-6 sm:text-6xl md:text-7xl lg:text-8xl">
            A chat UI for your business.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ui-muted sm:mt-8 sm:text-lg">
            Upload files, ingest website content, and ask grounded questions with
            citations. Built for internal teams and client-facing portals.
          </p>
        </section>

        <nav
          className="mt-12 w-full border-t border-black sm:mt-16 lg:mt-24"
          aria-label="Get started"
        >
          <Link
            href="/signup"
            className="group flex min-h-[56px] items-center justify-between gap-4 border-b border-black py-4 transition-colors hover:bg-neutral-50 sm:min-h-[64px] sm:gap-6 sm:py-6"
          >
            <span className="min-w-0 text-base font-medium tracking-tight text-ui-text sm:text-lg md:text-xl">
              Get started free
            </span>
            <span
              className="shrink-0 text-2xl font-extralight text-ui-muted transition-colors group-hover:text-ui-text sm:text-3xl"
              aria-hidden
            >
              ›
            </span>
          </Link>
          <Link
            href="/login"
            className="group flex min-h-[56px] items-center justify-between gap-4 border-b border-black py-4 transition-colors hover:bg-neutral-50 sm:min-h-[64px] sm:gap-6 sm:py-6"
          >
            <span className="min-w-0 text-base font-medium tracking-tight text-ui-text sm:text-lg md:text-xl">
              I already have an account
            </span>
            <span
              className="shrink-0 text-2xl font-extralight text-ui-muted transition-colors group-hover:text-ui-text sm:text-3xl"
              aria-hidden
            >
              ›
            </span>
          </Link>
        </nav>

        <section className="mt-16 w-full max-w-xl border-t border-black pt-12 sm:mt-20 sm:pt-16 lg:mt-28">
          <h2 className="text-[10px] font-medium uppercase tracking-[0.35em] text-ui-muted-dim">
            How it works
          </h2>
          <ol className="mt-6 space-y-5 text-sm leading-relaxed text-ui-muted sm:mt-8 sm:space-y-6 sm:text-base">
            {howItWorks.map((step, index) => (
              <li
                key={step}
                className={
                  index < howItWorks.length - 1
                    ? "flex gap-3 border-b border-black/10 pb-5 sm:gap-4 sm:pb-6"
                    : "flex gap-3 sm:gap-4"
                }
              >
                <span className="shrink-0 font-medium tabular-nums text-ui-text">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
