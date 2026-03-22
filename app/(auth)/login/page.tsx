import Link from "next/link";

import { siteConfig } from "@/lib/config";

export const metadata = {
  title: `Sign in — ${siteConfig.name}`,
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#050816] px-6 py-16 text-zinc-100">
      <div className="mx-auto w-full max-w-sm">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-400/80">
          {siteConfig.org.serviceLine}
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Sign in to {siteConfig.name}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Supabase authentication will be wired in Phase 2. This route reserves
          the URL and layout for the real login form.
        </p>
        <div className="mt-10 rounded-xl border border-white/10 bg-white/3 p-6 text-sm text-zinc-500">
          Email / password form placeholder
        </div>
        <p className="mt-8 text-center text-sm text-zinc-500">
          No account?{" "}
          <Link href="/signup" className="text-cyan-400 hover:text-cyan-300">
            Create one
          </Link>
        </p>
        <p className="mt-6 text-center">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
