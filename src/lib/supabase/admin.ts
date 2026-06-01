import { createClient } from "@supabase/supabase-js";
import { requireSupabaseServiceRoleEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export function createSupabaseAdminClient() {
  const { supabaseUrl, serviceRoleKey } = requireSupabaseServiceRoleEnv();

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
