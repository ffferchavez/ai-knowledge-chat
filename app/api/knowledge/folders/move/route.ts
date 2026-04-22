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
    folderId?: string | null;
    documentId?: string;
    webSourceId?: string;
  };

  let targetFolderId: string | null;
  try {
    targetFolderId = await resolveFolderForKnowledgeBase(
      supabase,
      workspace.knowledgeBase.id,
      workspace.organization.id,
      body.folderId,
    );
  } catch {
    return NextResponse.json({ error: "Invalid folder." }, { status: 400 });
  }

  const docId =
    typeof body.documentId === "string" && body.documentId.length > 0
      ? body.documentId
      : null;
  const webId =
    typeof body.webSourceId === "string" && body.webSourceId.length > 0
      ? body.webSourceId
      : null;

  if (!docId && !webId) {
    return NextResponse.json(
      { error: "documentId or webSourceId is required." },
      { status: 400 },
    );
  }
  if (docId && webId) {
    return NextResponse.json(
      { error: "Send only one of documentId or webSourceId." },
      { status: 400 },
    );
  }

  if (docId) {
    const { data: doc, error: dErr } = await supabase
      .from("documents")
      .select("id, source_id, knowledge_base_id")
      .eq("id", docId)
      .maybeSingle();

    if (dErr || !doc || doc.knowledge_base_id !== workspace.knowledgeBase.id) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const { error: u1 } = await supabase
      .from("documents")
      .update({ folder_id: targetFolderId })
      .eq("id", docId);
    if (u1) {
      return NextResponse.json({ error: u1.message }, { status: 500 });
    }

    if (doc.source_id) {
      await supabase
        .from("sources")
        .update({ folder_id: targetFolderId })
        .eq("id", doc.source_id);
    }

    return NextResponse.json({ ok: true });
  }

  const { data: src, error: sErr } = await supabase
    .from("sources")
    .select("id, knowledge_base_id, source_type")
    .eq("id", webId!)
    .maybeSingle();

  if (sErr || !src || src.knowledge_base_id !== workspace.knowledgeBase.id) {
    return NextResponse.json({ error: "Source not found." }, { status: 404 });
  }
  if (src.source_type !== "web") {
    return NextResponse.json(
      { error: "Use documentId for file or text sources." },
      { status: 400 },
    );
  }

  const { error: u2 } = await supabase
    .from("sources")
    .update({ folder_id: targetFolderId })
    .eq("id", webId!);
  if (u2) {
    return NextResponse.json({ error: u2.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
