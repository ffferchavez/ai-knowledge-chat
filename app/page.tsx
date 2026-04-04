import Link from "next/link";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { siteConfig } from "@/lib/config";

const howItWorks = [
  "Connect your company files and website pages.",
  "Ask business questions in natural language.",
  "Get grounded answers with source references.",
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="pt-20">
          <div className="helion-shell">
            <p className="helion-kicker">
              {siteConfig.org.city} · {siteConfig.org.serviceLine}
            </p>
            <h1 className="mt-4 max-w-3xl text-5xl font-medium tracking-tight text-[#0d0d0f] sm:text-7xl sm:leading-[0.98]">
              A chat UI for your business.
            </h1>
            <p className="mt-8 max-w-2xl text-xl leading-relaxed text-[#616167]">
              Upload files, ingest website content, and ask grounded questions with
              citations. Built for internal teams and client-facing portals.
            </p>
            <div className="mt-16 helion-rule" />
            <div className="grid">
              <Link
                href="/signup"
                className="flex h-16 items-center justify-between border-b border-[#c8c8cc] px-1 text-xl text-[#111114] transition hover:bg-[#e7e7ea]"
              >
                <span>Get started free</span>
                <span className="text-2xl text-[#6f6f73]">›</span>
              </Link>
              <Link
                href="/login"
                className="flex h-16 items-center justify-between border-b border-[#c8c8cc] px-1 text-xl text-[#111114] transition hover:bg-[#e7e7ea]"
              >
                <span>I already have an account</span>
                <span className="text-2xl text-[#6f6f73]">›</span>
              </Link>
            </div>
          </div>
        </section>
        <section className="py-24">
          <div className="helion-shell">
            <div className="max-w-xl">
              <div className="helion-rule" />
              <p className="mt-16 helion-kicker">How it works</p>
              <ol className="mt-5">
                {howItWorks.map((step, index) => (
                  <li
                    key={step}
                    className="flex gap-5 border-b border-[#dfdfe2] py-5 text-[#1a1a1d]"
                  >
                    <span className="w-6 text-[0.76rem] tracking-[0.18em] text-[#55555a]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[1.03rem] text-[#3b3b40]">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
