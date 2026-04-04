import { AppShellClient } from "@/components/app/app-shell-client";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShellClient>{children}</AppShellClient>;
}
