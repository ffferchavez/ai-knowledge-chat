import { NextResponse } from "next/server";

import { requireDevAdmin } from "@/lib/server/dev-guard";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceSnapshot } from "@/lib/workspace";

export async function POST(request: Request) {
  const guard = requireDevAdmin(request);
  if (guard) return guard;

  const workspace = await getWorkspaceSnapshot();
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 403 });
  }
  const supabase = await createClient();
  const orgId = workspace.organization.id;
  const kbId = workspace.knowledgeBase.id;

  // Delete in dependency-safe order.
  await supabase.from("ingestion_jobs").delete().eq("knowledge_base_id", kbId);
  await supabase.from("chat_sessions").delete().eq("knowledge_base_id", kbId);
  await supabase.from("document_chunks").delete().eq("knowledge_base_id", kbId);
  await supabase.from("source_pages").delete().eq("knowledge_base_id", kbId);
  await supabase.from("documents").delete().eq("knowledge_base_id", kbId);
  await supabase.from("sources").delete().eq("knowledge_base_id", kbId);
  await supabase
    .from("usage_events")
    .delete()
    .eq("organization_id", orgId)
    .eq("user_id", workspace.profile.id);

  return NextResponse.json({ ok: true });
}
