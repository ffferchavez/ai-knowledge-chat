import { NextResponse } from "next/server";

import {
  claimNextQueuedIngestionJob,
  runIngestionJobById,
} from "@/lib/server/ingestion-jobs";
import { createServiceClient } from "@/lib/supabase/service";

function hasValidCronSecret(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const authHeader = request.headers.get("authorization");
  const tokenFromBearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  const tokenFromHeader = request.headers.get("x-cron-secret");
  const provided = tokenFromBearer ?? tokenFromHeader;

  return provided === expected;
}

export async function POST(request: Request) {
  if (!hasValidCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get("limit") ?? "1");
  const limit = Number.isFinite(rawLimit)
    ? Math.min(10, Math.max(1, Math.floor(rawLimit)))
    : 1;

  const processed: Array<{ job_id: string; ok: boolean; error?: string }> = [];
  for (let i = 0; i < limit; i += 1) {
    const jobId = await claimNextQueuedIngestionJob(supabase);
    if (!jobId) break;
    try {
      await runIngestionJobById(supabase, jobId);
      processed.push({ job_id: jobId, ok: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Job processing failed.";
      processed.push({ job_id: jobId, ok: false, error: message });
    }
  }

  if (processed.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  const allOk = processed.every((p) => p.ok);
  return NextResponse.json(
    {
      ok: allOk,
      processed: processed.length,
      jobs: processed,
    },
    { status: allOk ? 200 : 500 },
  );
}
