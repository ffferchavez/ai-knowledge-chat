import Link from "next/link";

export const metadata = {
  title: "Create account — Helion Intelligence",
};

export default function SignupPage() {
  return (
    <div className="flex w-full min-w-0 flex-1 flex-col items-center justify-center py-10 sm:py-16 md:py-20">
      <div className="w-full max-w-md border border-black bg-ui-bg p-6 sm:p-10 md:p-12">
        <div className="mb-8 sm:mb-10">
          <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-ui-muted-dim">
            Account
          </p>
          <h1 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-ui-text sm:mt-4 sm:text-3xl">
            Create an account
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ui-muted sm:mt-4">
            Takes about a minute. No credit card.
          </p>
        </div>

        <form className="space-y-4">
          <label className="block text-[13px] font-medium tracking-wide text-ui-text">
            Your name
            <input
              className="mt-2 min-h-[44px] w-full border border-neutral-950 bg-ui-bg px-3 text-[14px] text-ui-text placeholder:text-ui-muted-dim"
              type="text"
              placeholder="Alex Rivera"
              disabled
            />
          </label>
          <label className="block text-[13px] font-medium tracking-wide text-ui-text">
            Email
            <input
              className="mt-2 min-h-[44px] w-full border border-neutral-950 bg-ui-bg px-3 text-[14px] text-ui-text placeholder:text-ui-muted-dim"
              type="email"
              placeholder="you@company.com"
              disabled
            />
          </label>
          <label className="block text-[13px] font-medium tracking-wide text-ui-text">
            Password
            <input
              className="mt-2 min-h-[44px] w-full border border-neutral-950 bg-ui-bg px-3 text-[14px] text-ui-text"
              type="password"
              disabled
            />
            <span className="mt-2 block text-xs text-ui-muted-dim">
              At least 8 characters.
            </span>
          </label>
          <button
            type="button"
            className="inline-flex min-h-[44px] w-full items-center justify-center border border-neutral-950 bg-neutral-950 px-4 py-2 text-[13px] font-medium tracking-wide text-white transition-colors hover:bg-neutral-800"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ui-muted sm:mt-8">
          Already have an account?{" "}
          <Link
            href="/login"
            className="underline decoration-black/25 underline-offset-4 transition hover:decoration-black"
          >
            Log in
          </Link>
        </p>
        <p className="mt-8 text-center text-sm text-ui-muted-dim sm:mt-10">
          <Link
            href="/"
            className="underline decoration-black/25 underline-offset-4 transition hover:decoration-black"
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
