import { redirect } from "next/navigation";

import { AppShellClient } from "@/components/app/app-shell-client";
import { createClient } from "@/lib/supabase/server";

function userInitials(name: string, email: string) {
  const cleanName = name.trim();
  if (cleanName) {
    const pieces = cleanName.split(/\s+/).filter(Boolean);
    if (pieces.length === 1) return pieces[0].slice(0, 2).toUpperCase();
    return `${pieces[0][0] ?? ""}${pieces[1][0] ?? ""}`.toUpperCase();
  }
  if (email.includes("@")) {
    return email.slice(0, 2).toUpperCase();
  }
  return "ME";
}

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const displayName =
    typeof meta?.full_name === "string"
      ? meta.full_name
      : typeof meta?.name === "string"
        ? meta.name
        : "";

  return (
    <AppShellClient
      displayName={displayName || user.email || "Account"}
      initials={userInitials(displayName, user.email || "")}
    >
      {children}
    </AppShellClient>
  );
}
