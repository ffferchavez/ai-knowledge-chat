import Link from "next/link";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { siteConfig } from "@/lib/config";

const features = [
  {
    title: "Private knowledge bases",
    body: "Organize documents per workspace. Built for future multi-tenant SaaS, simple in v1.",
  },
  {
    title: "Grounded answers",
    body: "Retrieve the most relevant chunks with pgvector, then answer with OpenAI using your sources.",
  },
  {
    title: "Citations you can trust",
    body: "Every response can point back to the exact passages that supported it.",
  },
  {
    title: "No extra backend",
    body: "Next.js route handlers and server modules only — fewer moving parts, faster to ship.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-[#050816]">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-white/10">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            aria-hidden
            style={{
              backgroundImage:
                "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34, 211, 238, 0.25), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(59, 130, 246, 0.15), transparent)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pt-28">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-cyan-400/90">
              {siteConfig.org.city} · {siteConfig.org.serviceLine}
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl sm:leading-[1.1]">
              {siteConfig.name}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
              {siteConfig.tagline}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-[#041018] shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
              >
                Start free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:border-white/30 hover:bg-white/5"
              >
                Sign in
              </Link>
            </div>
            <p className="mt-8 text-xs text-zinc-600">
              PDF, TXT, and DOCX · Supabase Auth &amp; Storage · pgvector ·
              OpenAI
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Why teams use it
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/3 p-6 transition hover:border-cyan-500/20 hover:bg-white/5"
              >
                <h3 className="text-lg font-medium text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/10 bg-[#030712] py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col gap-8 rounded-2xl border border-cyan-500/20 bg-linear-to-br from-cyan-500/10 via-transparent to-blue-500/10 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Ready when you are
                </h2>
                <p className="mt-2 max-w-xl text-sm text-zinc-400">
                  Phase 1 delivers the landing experience and database foundation.
                  Auth, uploads, and chat follow in the roadmap.
                </p>
              </div>
              <Link
                href="/signup"
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#041018] transition hover:bg-zinc-100"
              >
                Create an account
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
