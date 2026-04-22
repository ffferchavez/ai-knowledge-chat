"use client";

import { AppShell } from "@/components/app/app-shell";

export function AppShellClient({
  displayName,
  initials,
  children,
}: {
  displayName: string;
  initials: string;
  children: React.ReactNode;
}) {
  return (
    <AppShell
      displayName={displayName}
      initials={initials}
    >
      {children}
    </AppShell>
  );
}
