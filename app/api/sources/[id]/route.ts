import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getWorkspaceSnapshot } from "@/lib/workspace";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const workspace = await getWorkspaceSnapshot();
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 403 });
  }
  const supabase = await createClient();
  const { data: source, error } = await supabase
    .from("sources")
    .select("id, title, source_type, status, error_message, indexed_at, metadata, created_at")
    .eq("id", id)
    .eq("knowledge_base_id", workspace.knowledgeBase.id)
    .maybeSingle();
  if (error || !source) {
    return NextResponse.json({ error: error?.message ?? "Source not found" }, { status: 404 });
  }
  return NextResponse.json(source);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const workspace = await getWorkspaceSnapshot();
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 403 });
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("sources")
    .delete()
    .eq("id", id)
    .eq("knowledge_base_id", workspace.knowledgeBase.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
