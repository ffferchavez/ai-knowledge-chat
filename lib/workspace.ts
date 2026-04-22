import { createClient } from "@/lib/supabase/server";

export type WorkspaceSnapshot = {
  profile: {
    id: string;
    email: string;
    full_name: string | null;
  };
  membershipRole: "owner" | "admin" | "member";
  organization: { id: string; name: string; slug: string };
  knowledgeBase: { id: string; name: string; slug: string };
  counts: {
    /** Indexed files in the default knowledge base (sources UI lands in Phase 4b). */
    documents: number;
    chatSessions: number;
  };
};

export async function getWorkspaceSnapshot(): Promise<WorkspaceSnapshot | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error: profileError } = await supabase
    .schema("public")
    .from("profiles")
    .select("id, email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) return null;

  const { data: membership, error: membershipError } = await supabase
    .schema("public")
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) return null;

  const role = membership.role;
  if (role !== "owner" && role !== "admin" && role !== "member") return null;

  const { data: org, error: orgError } = await supabase
    .schema("public")
    .from("organizations")
    .select("id, name, slug")
    .eq("id", membership.organization_id)
    .single();

  if (orgError || !org) return null;

  const { data: kb, error: kbError } = await supabase
    .schema("public")
    .from("knowledge_bases")
    .select("id, name, slug")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (kbError || !kb) return null;

  const { count: docCount } = await supabase
    .schema("public")
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("knowledge_base_id", kb.id);

  const { count: sessionCount } = await supabase
    .schema("public")
    .from("chat_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("knowledge_base_id", kb.id);

  return {
    profile,
    membershipRole: role,
    organization: org,
    knowledgeBase: kb,
    counts: {
      documents: docCount ?? 0,
      chatSessions: sessionCount ?? 0,
    },
  };
}
