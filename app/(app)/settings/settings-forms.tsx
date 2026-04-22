"use client";

import { useActionState } from "react";

import {
  updateOrganizationAction,
  updateProfileAction,
  type SettingsActionState,
} from "@/app/(app)/actions";

const initial: SettingsActionState = {};

function FormStatus({ state }: { state: SettingsActionState }) {
  if (state.error) {
    return (
      <p className="mt-2 text-sm text-ui-warning" role="alert">
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return <p className="mt-2 text-sm text-ui-muted">Saved.</p>;
  }
  return null;
}

export function ProfileSettingsForm({
  defaultFullName,
}: {
  defaultFullName: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initial,
  );

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <div>
        <label
          htmlFor="fullName"
          className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim"
        >
          Display name
        </label>
        <input
          id="fullName"
          name="fullName"
          defaultValue={defaultFullName}
          autoComplete="name"
          className="ui-input mt-2 rounded-none text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="ui-btn ui-btn-primary min-h-0 rounded-none px-4 py-2 text-xs uppercase tracking-[0.2em]"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
      <FormStatus state={state} />
    </form>
  );
}

export function OrganizationSettingsForm({
  defaultOrgName,
}: {
  defaultOrgName: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateOrganizationAction,
    initial,
  );

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <div>
        <label
          htmlFor="orgName"
          className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim"
        >
          Workspace name
        </label>
        <input
          id="orgName"
          name="orgName"
          defaultValue={defaultOrgName}
          autoComplete="organization"
          className="ui-input mt-2 rounded-none text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="ui-btn ui-btn-primary min-h-0 rounded-none px-4 py-2 text-xs uppercase tracking-[0.2em]"
      >
        {pending ? "Saving…" : "Save workspace"}
      </button>
      <FormStatus state={state} />
    </form>
  );
}
