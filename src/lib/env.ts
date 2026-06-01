export function getPublicSupabaseEnv() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  };
}

export function hasPublicSupabaseEnv() {
  const { supabaseUrl, supabaseAnonKey } = getPublicSupabaseEnv();

  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function requirePublicSupabaseEnv() {
  const env = getPublicSupabaseEnv();

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required."
    );
  }

  return {
    supabaseUrl: env.supabaseUrl,
    supabaseAnonKey: env.supabaseAnonKey
  };
}
