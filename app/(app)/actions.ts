"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getWorkspaceSnapshot } from "@/lib/workspace";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type SettingsActionState = { error?: string; ok?: boolean };

export async function updateProfileAction(
  _: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .schema("public")
    .from("profiles")
    .update({ full_name: fullName.length > 0 ? fullName : null })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/settings");
  return { ok: true };
}

export async function updateOrganizationAction(
  _: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const name = String(formData.get("orgName") ?? "").trim();
  if (name.length < 2) {
    return { error: "Workspace name must be at least 2 characters." };
  }

  const snap = await getWorkspaceSnapshot();
  if (!snap) {
    redirect("/login");
  }
  if (snap.membershipRole !== "owner" && snap.membershipRole !== "admin") {
    return { error: "You do not have permission to rename this workspace." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .schema("public")
    .from("organizations")
    .update({ name })
    .eq("id", snap.organization.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/settings");
  return { ok: true };
}
