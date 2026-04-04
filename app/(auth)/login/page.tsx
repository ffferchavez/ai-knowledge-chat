import Link from "next/link";

export const metadata = {
  title: "Log in — Helion Intelligence",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6 py-14">
      <div className="helion-panel w-full max-w-md p-9">
        <p className="helion-kicker">Account</p>
        <h1 className="mt-3 text-4xl font-medium tracking-tight text-[#101012]">
          Log in
        </h1>
        <p className="mt-3 text-sm text-[#66666c]">
          Use the email and password you signed up with.
        </p>

        <form className="mt-8 space-y-4">
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
          </label>
          <button type="button" className="helion-btn-primary mt-2 w-full">
            Log in
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-[#68686e]">
          New here?{" "}
          <Link href="/signup" className="underline underline-offset-3">
            Sign up
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
