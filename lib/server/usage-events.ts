import type { createClient } from "@/lib/supabase/server";

export async function logUsageEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    organizationId: string;
    userId: string;
    eventType: string;
    metadata?: Record<string, unknown>;
  },
) {
  await supabase.from("usage_events").insert({
    organization_id: input.organizationId,
    user_id: input.userId,
    event_type: input.eventType,
    metadata: input.metadata ?? {},
  });
}
