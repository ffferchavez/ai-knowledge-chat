import { NextResponse } from "next/server";

import { resolveFolderForKnowledgeBase } from "@/lib/server/knowledge-folders";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceSnapshot } from "@/lib/workspace";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await getWorkspaceSnapshot();
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    parentFolderId?: string | null;
  };

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Folder name is required." }, { status: 400 });
  }

  let parentId: string | null = null;
  if (body.parentFolderId) {
    try {
      parentId = await resolveFolderForKnowledgeBase(
        supabase,
        workspace.knowledgeBase.id,
        workspace.organization.id,
        body.parentFolderId,
      );
    } catch {
      return NextResponse.json({ error: "Invalid parent folder." }, { status: 400 });
    }
  }

  const { data: row, error } = await supabase
    .from("source_folders")
    .insert({
      knowledge_base_id: workspace.knowledgeBase.id,
      organization_id: workspace.organization.id,
      parent_folder_id: parentId,
      name,
      created_by: user.id,
    })
    .select("id, name, parent_folder_id")
    .maybeSingle();

  if (error || !row) {
    const msg =
      error?.code === "23505"
        ? "A folder with that name already exists here."
        : (error?.message ?? "Could not create folder.");
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ folder: row });
}
