import { NextResponse } from "next/server";

import {
  enqueueIngestionJob,
  shouldInlineIngest,
  runIngestionJobById,
} from "@/lib/server/ingestion-jobs";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { logUsageEvent } from "@/lib/server/usage-events";
import { getWorkspaceSnapshot } from "@/lib/workspace";

function normalizeSeedUrl(value: string) {
  const raw = value.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

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
  const rate = await checkRateLimit({
    key: `sources-url:${user.id}`,
    limit: 12,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "URL ingest rate limit exceeded. Please wait a moment." },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    url?: string;
    title?: string;
  };
  const seedUrl = normalizeSeedUrl(String(body.url ?? ""));
  if (!seedUrl) {
    return NextResponse.json({ error: "Valid URL is required." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim() || seedUrl;
  const { data: source, error: sourceError } = await supabase
    .from("sources")
    .insert({
      organization_id: workspace.organization.id,
      knowledge_base_id: workspace.knowledgeBase.id,
      created_by: user.id,
      source_type: "web",
      title,
      status: "pending",
      metadata: { seed_url: seedUrl },
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (sourceError || !source?.id) {
    return NextResponse.json(
      { error: sourceError?.message ?? "Could not create source." },
      { status: 500 },
    );
  }

  const queued = await enqueueIngestionJob(supabase, {
    organizationId: workspace.organization.id,
    knowledgeBaseId: workspace.knowledgeBase.id,
    createdBy: user.id,
    sourceId: source.id,
    jobType: "web_crawl",
  });

  // For tiny single-page requests we can opportunistically run inline.
  let inlineError: string | null = null;
  if (shouldInlineIngest(1024)) {
    try {
      await runIngestionJobById(supabase, queued.id);
    } catch (error) {
      inlineError = error instanceof Error ? error.message : "Inline crawl failed.";
    }
  }
  await logUsageEvent(supabase, {
    organizationId: workspace.organization.id,
    userId: workspace.profile.id,
    eventType: "web_source_created",
    metadata: { source_id: source.id, url: seedUrl, inline_error: inlineError },
  });

  return NextResponse.json({
    source_id: source.id,
    job_id: queued.id,
    status: inlineError ? "queued" : "processing",
    inline_error: inlineError,
  });
}
