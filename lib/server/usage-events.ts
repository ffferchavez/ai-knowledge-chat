import type { SupabaseClient } from "@supabase/supabase-js";

export async function logUsageEvent(
  supabase: SupabaseClient,
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
