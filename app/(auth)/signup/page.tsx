import Link from "next/link";

export const metadata = {
  title: "Create account — Helion Intelligence",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6 py-14">
      <div className="helion-panel w-full max-w-md p-9">
        <p className="helion-kicker">Account</p>
        <h1 className="mt-3 text-4xl font-medium tracking-tight text-[#101012]">
          Create an account
        </h1>
        <p className="mt-3 text-sm text-[#66666c]">
          Takes about a minute. No credit card.
        </p>

        <form className="mt-8 space-y-4">
          <label className="block text-[0.82rem] text-[#303035]">
            Your name
            <input
              className="helion-input mt-1.5"
              type="text"
              placeholder="Alex Rivera"
              disabled
            />
          </label>
          <label className="block text-[0.82rem] text-[#303035]">
            Email
            <input
              className="helion-input mt-1.5"
              type="email"
              placeholder="you@company.com"
              disabled
            />
          </label>
          <label className="block text-[0.82rem] text-[#303035]">
            Password
            <input className="helion-input mt-1.5" type="password" disabled />
            <span className="mt-1 block text-xs text-[#7b7b81]">
              At least 8 characters.
            </span>
          </label>
          <button type="button" className="helion-btn-primary mt-2 w-full">
            Create account
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-[#68686e]">
          Already have an account?{" "}
          <Link href="/login" className="underline underline-offset-3">
            Sign in
          </Link>
        </p>
        <p className="mt-6 text-center text-sm text-[#68686e]">
          <Link href="/" className="underline underline-offset-3">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
