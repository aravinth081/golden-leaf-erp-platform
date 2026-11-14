// ──────────────────────────────────────────────────
// Golden Leaf Finance — Supabase Client Configuration
// High-performance PostgreSQL backend adapter with offline fallback
// ──────────────────────────────────────────────────

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://snlqwtkegteoezgedkkd.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eF5g3saqqxWtLYuhSAWJxg_ZOm7BSOn';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('placeholder')
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export default supabase;
