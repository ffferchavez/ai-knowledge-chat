import type { createClient } from "@/lib/supabase/server";

import { ingestDocumentById } from "@/lib/server/ingest-document";
import { ingestWebSourceById } from "@/lib/server/ingest-web";
import { logUsageEvent } from "@/lib/server/usage-events";

type JobType = "file_ingest" | "reindex" | "web_crawl";

type JobRow = {
  id: string;
  organization_id: string;
  knowledge_base_id: string;
  source_id: string | null;
  created_by: string;
  job_type: JobType;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  payload:
    | { documentId?: string; document_id?: string; sourceId?: string; source_id?: string }
    | null;
  attempts: number;
  max_attempts: number;
};

const DEFAULT_INLINE_MAX_BYTES = 2 * 1024 * 1024;

export function shouldInlineIngest(sizeBytes: number) {
  const configured = Number(process.env.INGEST_INLINE_MAX_BYTES ?? "");
  const threshold = Number.isFinite(configured)
    ? Math.max(0, configured)
    : DEFAULT_INLINE_MAX_BYTES;
  return sizeBytes <= threshold;
}

export async function enqueueIngestionJob(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    organizationId: string;
    knowledgeBaseId: string;
    createdBy: string;
    documentId?: string;
    sourceId?: string;
    jobType: JobType;
  },
) {
  const payload: Record<string, string> = {};
  if (input.documentId) payload.documentId = input.documentId;
  if (input.sourceId) payload.sourceId = input.sourceId;

  const { data, error } = await supabase
    .from("ingestion_jobs")
    .insert({
      organization_id: input.organizationId,
      knowledge_base_id: input.knowledgeBaseId,
      created_by: input.createdBy,
      source_id: input.sourceId ?? null,
      job_type: input.jobType,
      status: "queued",
      payload,
    })
    .select("id, status")
    .maybeSingle<{ id: string; status: string }>();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not enqueue ingestion job.");
  }

  return data;
}

export async function queueDocumentIngestion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    organizationId: string;
    knowledgeBaseId: string;
    createdBy: string;
    documentId: string;
    sizeBytes: number;
    jobType: JobType;
  },
) {
  const queued = await enqueueIngestionJob(supabase, {
    organizationId: input.organizationId,
    knowledgeBaseId: input.knowledgeBaseId,
    createdBy: input.createdBy,
    documentId: input.documentId,
    sourceId: undefined,
    jobType: input.jobType,
  });

  let inlineError: string | null = null;
  if (shouldInlineIngest(input.sizeBytes)) {
    try {
      await runIngestionJobById(supabase, queued.id);
    } catch (error) {
      inlineError =
        error instanceof Error ? error.message : "Inline ingestion failed.";
    }
  }

  return {
    jobId: queued.id,
    inlineError,
    mode: shouldInlineIngest(input.sizeBytes) ? "inline" : "worker",
  };
}

function readDocumentId(job: JobRow): string | null {
  const payload = job.payload ?? {};
  const candidate = payload.documentId ?? payload.document_id;
  return typeof candidate === "string" && candidate.length > 0 ? candidate : null;
}

function readSourceId(job: JobRow): string | null {
  const payload = job.payload ?? {};
  const candidate = payload.sourceId ?? payload.source_id ?? job.source_id;
  return typeof candidate === "string" && candidate.length > 0 ? candidate : null;
}

export async function runIngestionJobById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string,
): Promise<{
  jobId: string;
  status: "completed";
  documentId?: string;
  sourceId?: string;
}> {
  const { data: job, error: fetchError } = await supabase
    .from("ingestion_jobs")
    .select(
      "id, organization_id, knowledge_base_id, source_id, created_by, job_type, status, payload, attempts, max_attempts",
    )
    .eq("id", jobId)
    .maybeSingle<JobRow>();

  if (fetchError || !job) {
    throw new Error(fetchError?.message ?? "Job not found.");
  }

  await supabase
    .from("ingestion_jobs")
    .update({
      status: "running",
      error_message: null,
      attempts: (job.attempts ?? 0) + 1,
      started_at: new Date().toISOString(),
    })
    .eq("id", job.id);
  await logUsageEvent(supabase, {
    organizationId: job.organization_id,
    userId: job.created_by,
    eventType: "ingest_job_started",
    metadata: { job_id: job.id, job_type: job.job_type },
  });

  try {
    const documentId = readDocumentId(job);
    const sourceId = readSourceId(job);
    if (job.job_type === "web_crawl") {
      if (!sourceId) {
        throw new Error("Missing sourceId for web crawl job.");
      }
      await ingestWebSourceById(supabase, sourceId);
    } else {
      if (!documentId) {
        throw new Error("Missing documentId for ingestion job.");
      }
      await ingestDocumentById(supabase, documentId);
    }

    await supabase
      .from("ingestion_jobs")
      .update({
        status: "completed",
        error_message: null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    await logUsageEvent(supabase, {
      organizationId: job.organization_id,
      userId: job.created_by,
      eventType: "ingest_job_completed",
      metadata: { job_id: job.id, job_type: job.job_type },
    });

    return {
      jobId: job.id,
      status: "completed",
      documentId: documentId ?? undefined,
      sourceId: sourceId ?? undefined,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ingestion job failed.";
    const nextAttempts = (job.attempts ?? 0) + 1;
    const shouldRetry = nextAttempts < (job.max_attempts ?? 3);
    await supabase
      .from("ingestion_jobs")
      .update({
        status: shouldRetry ? "queued" : "failed",
        error_message: message,
        completed_at: shouldRetry ? null : new Date().toISOString(),
      })
      .eq("id", job.id);
    await logUsageEvent(supabase, {
      organizationId: job.organization_id,
      userId: job.created_by,
      eventType: "ingest_job_failed",
      metadata: {
        job_id: job.id,
        job_type: job.job_type,
        will_retry: shouldRetry,
        error: message,
      },
    });
    throw new Error(message);
  }
}

export async function claimNextQueuedIngestionJob(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string | null> {
  const { data: queued, error: fetchError } = await supabase
    .from("ingestion_jobs")
    .select("id")
    .eq("status", "queued")
    .in("job_type", ["file_ingest", "reindex", "web_crawl"])
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (fetchError || !queued?.id) return null;

  const { data: claimed, error: claimError } = await supabase
    .from("ingestion_jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", queued.id)
    .eq("status", "queued")
    .select("id")
    .maybeSingle<{ id: string }>();

  if (claimError || !claimed?.id) return null;
  return claimed.id;
}
