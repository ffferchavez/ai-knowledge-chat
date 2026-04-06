import { NextResponse } from "next/server";

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
  const { data: job, error } = await supabase
    .from("ingestion_jobs")
    .select("id, status, attempts, max_attempts, knowledge_base_id")
    .eq("id", id)
    .eq("knowledge_base_id", workspace.knowledgeBase.id)
    .maybeSingle<{
      id: string;
      status: string;
      attempts: number;
      max_attempts: number;
      knowledge_base_id: string;
    }>();
  if (error || !job) {
    return NextResponse.json({ error: error?.message ?? "Job not found" }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("ingestion_jobs")
    .update({
      status: "queued",
      error_message: null,
      attempts: Math.min(job.attempts, Math.max(0, job.max_attempts - 1)),
      completed_at: null,
      started_at: null,
    })
    .eq("id", job.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
