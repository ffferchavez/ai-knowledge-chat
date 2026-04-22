import Link from "next/link";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { siteConfig } from "@/lib/config";
import { PAGE_INSET } from "@/lib/ui/shell";

const howItWorks = [
  "Add files, pasted text, or a public web page.",
  "Ask questions in plain language.",
  "Read answers that point back to your sources.",
];

export default function Home() {
  return (
    <div
      className="flex min-h-[100dvh] min-h-screen flex-1 flex-col bg-transparent"
      suppressHydrationWarning
    >
      <SiteHeader />
      <main
        className={`flex min-h-0 flex-1 flex-col pb-12 pt-10 sm:pb-16 sm:pt-14 lg:pt-20 ${PAGE_INSET}`}
      >
        <section className="glass-panel w-full max-w-5xl p-6 sm:p-10">
          <p className="ui-kicker">
            {siteConfig.name}
          </p>
          <h1 className="mt-5 text-5xl font-medium leading-[1.05] tracking-[-0.035em] text-ui-ink-deep sm:mt-6 sm:text-6xl md:text-7xl lg:text-8xl">
            Chat with your documents.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ui-muted sm:mt-8 sm:text-lg">
            {siteConfig.tagline}
          </p>
        </section>

        <nav
          className="glass-panel mt-8 w-full p-4 sm:mt-10 sm:p-6 lg:mt-12"
          aria-label="Sign in"
        >
          <Link
            href="/login"
            className="ui-link-row group sm:min-h-[64px] sm:gap-6 sm:py-6"
          >
            <span className="min-w-0 text-base font-medium tracking-tight text-ui-ink-deep sm:text-lg md:text-xl">
              Log in
            </span>
            <span
              className="shrink-0 text-2xl font-extralight text-ui-muted transition-colors group-hover:text-ui-ink-deep sm:text-3xl"
              aria-hidden
            >
              ›
            </span>
          </Link>
        </nav>

        <section className="glass-panel mt-10 w-full max-w-xl p-6 sm:mt-12 sm:p-8">
          <h2 className="ui-kicker">
            How it works
          </h2>
          <ol className="mt-6 space-y-5 text-sm leading-relaxed text-ui-muted sm:mt-8 sm:space-y-6 sm:text-base">
            {howItWorks.map((step, index) => (
              <li
                key={step}
                className={
                  index < howItWorks.length - 1
                    ? "flex gap-3 border-b border-ui-line-soft pb-5 sm:gap-4 sm:pb-6"
                    : "flex gap-3 sm:gap-4"
                }
              >
                <span className="shrink-0 font-medium tabular-nums text-ui-ink-deep">
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
