import { NextResponse } from "next/server";

import {
  enqueueIngestionJob,
  runIngestionJobById,
  shouldInlineIngest,
} from "@/lib/server/ingestion-jobs";
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
    documentId?: string;
  };

  if (!body.documentId) {
    return NextResponse.json(
      { error: "documentId is required" },
      { status: 400 },
    );
  }

  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("id, organization_id, knowledge_base_id, size_bytes, status")
    .eq("id", body.documentId)
    .eq("knowledge_base_id", workspace.knowledgeBase.id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  try {
    const job = await enqueueIngestionJob(supabase, {
      organizationId: doc.organization_id,
      knowledgeBaseId: doc.knowledge_base_id,
      createdBy: user.id,
      documentId: doc.id,
      jobType: doc.status === "failed" ? "reindex" : "file_ingest",
    });

    const sizeBytes = typeof doc.size_bytes === "number" ? doc.size_bytes : 0;
    if (shouldInlineIngest(sizeBytes)) {
      try {
        const inlineResult = await runIngestionJobById(supabase, job.id);
        return NextResponse.json({
          id: doc.id,
          status: "ready",
          mode: "inline",
          job: inlineResult,
        });
      } catch (inlineError) {
        const message =
          inlineError instanceof Error
            ? inlineError.message
            : "Inline ingestion failed.";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    return NextResponse.json({
      id: doc.id,
      status: "queued",
      mode: "worker",
      job_id: job.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not queue ingestion.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
