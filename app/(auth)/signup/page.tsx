import Link from "next/link";
import { redirect } from "next/navigation";

import { SignupForm } from "@/components/auth/signup-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Create account — Helion Intelligence",
};

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

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

        <SignupForm />

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
