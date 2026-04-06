import { NextResponse } from "next/server";

import { enqueueIngestionJob, runIngestionJobById, shouldInlineIngest } from "@/lib/server/ingestion-jobs";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceSnapshot } from "@/lib/workspace";

export async function POST(
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
    .select("id, source_type")
    .eq("id", id)
    .eq("knowledge_base_id", workspace.knowledgeBase.id)
    .maybeSingle<{ id: string; source_type: string }>();
  if (error || !source) {
    return NextResponse.json({ error: error?.message ?? "Source not found" }, { status: 404 });
  }
  if (source.source_type !== "web") {
    return NextResponse.json({ error: "Reindex route supports web sources only." }, { status: 400 });
  }

  const queued = await enqueueIngestionJob(supabase, {
    organizationId: workspace.organization.id,
    knowledgeBaseId: workspace.knowledgeBase.id,
    createdBy: workspace.profile.id,
    sourceId: source.id,
    jobType: "web_crawl",
  });

  let inlineError: string | null = null;
  if (shouldInlineIngest(1024)) {
    try {
      await runIngestionJobById(supabase, queued.id);
    } catch (e) {
      inlineError = e instanceof Error ? e.message : "Inline reindex failed.";
    }
  }

  return NextResponse.json({ ok: true, job_id: queued.id, inline_error: inlineError });
}
