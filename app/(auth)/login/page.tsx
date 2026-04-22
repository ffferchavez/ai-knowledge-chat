import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { siteConfig } from "@/lib/config";
import { getDemoLoginCredentials } from "@/lib/demo-login";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: `Log in — ${siteConfig.name}`,
};

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const demo = getDemoLoginCredentials();

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col items-center justify-center py-10 sm:py-16 md:py-20">
      <div className="glass-elevated w-full max-w-md p-6 sm:p-10 md:p-12">
        <div className="mb-8 sm:mb-10">
          <p className="ui-kicker">
            Account
          </p>
          <h1 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-ui-ink-deep sm:mt-4 sm:text-3xl">
            Log in
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ui-muted sm:mt-4">
            {demo
              ? "Use the demo shortcut below, or sign in with your own account."
              : "Sign in with the account you were given for this demo."}
          </p>
        </div>

        <LoginForm demo={demo} />

        <p className="mt-8 text-center text-sm text-ui-muted-dim sm:mt-10">
          <Link
            href="/"
            className="underline decoration-ui-line underline-offset-4 transition hover:text-ui-ink-deep hover:decoration-ui-accent"
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
