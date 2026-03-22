import Link from "next/link";

import { siteConfig } from "@/lib/config";

export const metadata = {
  title: `Create account — ${siteConfig.name}`,
};

export default function SignupPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#050816] px-6 py-16 text-zinc-100">
      <div className="mx-auto w-full max-w-sm">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-400/80">
          {siteConfig.org.serviceLine}
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Create your workspace
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Signup will provision your profile, organization, and default
          knowledge base via Supabase (see migration trigger). Implemented in
          Phase 2.
        </p>
        <div className="mt-10 rounded-xl border border-white/10 bg-white/3 p-6 text-sm text-zinc-500">
          Registration form placeholder
        </div>
        <p className="mt-8 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300">
            Sign in
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
