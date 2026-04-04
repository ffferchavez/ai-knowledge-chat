"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { AuthActionState, signupAction } from "@/app/(auth)/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="inline-flex min-h-[44px] w-full items-center justify-center border border-neutral-950 bg-neutral-950 px-4 py-2 text-[13px] font-medium tracking-wide text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
    >
      {pending ? "Creating account..." : "Create account"}
    </button>
  );
}

const initialState: AuthActionState = {};

export function SignupForm() {
  const [state, formAction] = useActionState(signupAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-[13px] font-medium tracking-wide text-ui-text">
        Your name
        <input
          className="mt-2 min-h-[44px] w-full border border-neutral-950 bg-ui-bg px-3 text-[14px] text-ui-text placeholder:text-ui-muted-dim"
          type="text"
          name="fullName"
          autoComplete="name"
          placeholder="Alex Rivera"
          required
        />
      </label>
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
          autoComplete="new-password"
          minLength={8}
          required
        />
        <span className="mt-2 block text-xs text-ui-muted-dim">
          At least 8 characters.
        </span>
      </label>
      {state.error ? (
        <p className="text-sm text-ui-warning" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="text-sm text-ui-muted" role="status">
          {state.message}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
