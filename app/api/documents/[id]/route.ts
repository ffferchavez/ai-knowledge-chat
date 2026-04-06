import { NextResponse } from "next/server";

import { KNOWLEDGE_BUCKET } from "@/lib/documents-policy";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("id, storage_path")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const { error: rmError } = await supabase.storage
    .from(KNOWLEDGE_BUCKET)
    .remove([doc.storage_path]);

  if (rmError) {
    return NextResponse.json({ error: rmError.message }, { status: 500 });
  }

  const { error: delError } = await supabase
    .from("documents")
    .delete()
    .eq("id", id);

  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
