import { redirect } from "next/navigation";

import { siteConfig } from "@/lib/config";
import { getWorkspaceSnapshot } from "@/lib/workspace";

import {
  OrganizationSettingsForm,
  ProfileSettingsForm,
} from "./settings-forms";

export const metadata = {
  title: `Settings — ${siteConfig.name}`,
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
      <header className="glass-panel w-full p-6 sm:p-8">
        <p className="ui-kicker">
          Settings
        </p>
        <h1 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-ui-ink-deep sm:mt-4 sm:text-3xl md:text-4xl">
          Account &amp; workspace
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ui-muted sm:mt-6 sm:text-base">
          {snap.organization.name} · {snap.knowledgeBase.name}
        </p>
      </header>

      <section className="glass-panel mt-4 w-full p-6 sm:p-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim">
          Profile
        </p>
        <p className="mt-2 text-sm text-ui-muted">
          Signed in as{" "}
          <span className="font-medium text-ui-ink-deep">{snap.profile.email}</span>
        </p>
        <ProfileSettingsForm
          defaultFullName={snap.profile.full_name ?? ""}
        />
      </section>

      {canRenameWorkspace ? (
        <section className="glass-panel mt-4 w-full p-6 sm:p-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-ui-muted-dim">
            Workspace
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ui-muted">
            This name is shown to everyone in your organization. Your library
            is &quot;{snap.knowledgeBase.name}&quot;.
          </p>
          <OrganizationSettingsForm defaultOrgName={snap.organization.name} />
        </section>
      ) : null}
    </div>
  );
}
