"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";

import { AuthActionState, loginAction } from "@/app/(auth)/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="ui-btn ui-btn-primary w-full"
      disabled={pending}
    >
      {pending ? "Logging in..." : "Log in"}
    </button>
  );
}

const initialState: AuthActionState = {};

export function LoginForm({
  demo,
}: {
  demo?: { email: string; password: string } | null;
}) {
  const [state, formAction] = useActionState(loginAction, initialState);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const fillDemo = () => {
    if (!demo) return;
    const emailEl = emailRef.current;
    const passwordEl = passwordRef.current;
    if (emailEl) emailEl.value = demo.email;
    if (passwordEl) passwordEl.value = demo.password;
    emailEl?.focus();
  };

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {demo ? (
        <div className="rounded-xl border border-ui-line/80 bg-ui-surface/40 p-4 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ui-muted">
            Demo login
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ui-text">
            One tap fills the fields below — then press{" "}
            <span className="font-medium text-ui-ink-deep">Log in</span>.
          </p>
          <button
            type="button"
            onClick={fillDemo}
            className="ui-btn ui-btn-secondary mt-3 w-full min-h-10 text-[13px]"
          >
            Use demo account
          </button>
          <p className="mt-3 font-mono text-[12px] leading-relaxed text-ui-muted-dim break-all">
            <span className="text-ui-muted">Email</span>{" "}
            <span className="text-ui-text">{demo.email}</span>
          </p>
        </div>
      ) : null}
      <label className="block text-[13px] font-medium tracking-wide text-ui-text">
        Email
        <input
          ref={emailRef}
          className="ui-input mt-2 min-h-[44px] text-[14px]"
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
          ref={passwordRef}
          className="ui-input mt-2 min-h-[44px] text-[14px]"
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
