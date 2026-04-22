import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { getSharedAuthCookieOptions } from "@/lib/supabase/cookie-options";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (browserClient) return browserClient;
  const { supabaseUrl, supabaseKey } = getSupabasePublicEnv();

  browserClient = createBrowserClient(supabaseUrl, supabaseKey, {
    db: { schema: "public" },
    cookieOptions: getSharedAuthCookieOptions(),
  });

  return browserClient;
}
