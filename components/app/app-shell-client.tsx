"use client";

import { AppShell } from "@/components/app/app-shell";

export function AppShellClient({
  displayName,
  initials,
  portalDashboardHref,
  children,
}: {
  displayName: string;
  initials: string;
  portalDashboardHref: string;
  children: React.ReactNode;
}) {
  return (
    <AppShell
      displayName={displayName}
      initials={initials}
      portalDashboardHref={portalDashboardHref}
    >
      {children}
    </AppShell>
  );
}
