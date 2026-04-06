import { redirect } from "next/navigation";

import { getWorkspaceSnapshot } from "@/lib/workspace";

import {
  OrganizationSettingsForm,
  ProfileSettingsForm,
} from "./settings-forms";

export const metadata = {
  title: "Settings — Helion Intelligence",
};

export default async function SettingsPage() {
  const snap = await getWorkspaceSnapshot();
  if (!snap) {
    redirect("/login");
  }

  const canRenameWorkspace =
    snap.membershipRole === "owner" || snap.membershipRole === "admin";

  return (
    <div className="flex w-full min-w-0 flex-col">
      <header className="w-full border-b border-black pb-8 sm:pb-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-ui-muted-dim">
          Settings
        </p>
        <h1 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-ui-text sm:mt-4 sm:text-3xl md:text-4xl">
          Account &amp; workspace
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ui-muted sm:mt-6 sm:text-base">
          {snap.organization.name} · {snap.knowledgeBase.name}
        </p>
      </header>

      <section className="mt-0 w-full border-t border-black py-8 sm:py-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim">
          Profile
        </p>
        <p className="mt-2 text-sm text-ui-muted">
          Signed in as{" "}
          <span className="font-medium text-ui-text">{snap.profile.email}</span>
        </p>
        <ProfileSettingsForm
          defaultFullName={snap.profile.full_name ?? ""}
        />
      </section>

      {canRenameWorkspace ? (
        <section className="w-full border-t border-black py-8 sm:py-10">
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim">
            Workspace
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ui-muted">
            This name is shown across your team&apos;s workspace. Knowledge base
            title stays &quot;{snap.knowledgeBase.name}&quot; until multi-base
            controls ship.
          </p>
          <OrganizationSettingsForm defaultOrgName={snap.organization.name} />
        </section>
      ) : null}
    </div>
  );
}
