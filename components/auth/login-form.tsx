"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";

import { AuthActionState, loginAction } from "@/app/(auth)/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="inline-flex min-h-[44px] w-full items-center justify-center border border-neutral-950 bg-neutral-950 px-4 py-2 text-[13px] font-medium tracking-wide text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
    >
      {pending ? "Logging in..." : "Log in"}
    </button>
  );
}

const initialState: AuthActionState = {};

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block text-[13px] font-medium tracking-wide text-ui-text">
        Email
        <input
          className="mt-2 min-h-[44px] w-full border border-neutral-950 bg-ui-bg px-3 text-[14px] text-ui-text placeholder:text-ui-muted-dim"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
        />
      </label>
      <label className="block text-[13px] font-medium tracking-wide text-ui-text">
        Password
        <input
          className="mt-2 min-h-[44px] w-full border border-neutral-950 bg-ui-bg px-3 text-[14px] text-ui-text"
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </label>
      {state.error ? (
        <p className="text-sm text-ui-warning" role="alert">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
