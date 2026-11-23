import { createClient } from '@supabase/supabase-js';

/**
 * Browser Supabase client.
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * from .env.local (see .env.example). The anon key is public by design —
 * Row Level Security in supabase/schema.sql is what protects the data.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(url, anonKey);

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey && url.startsWith('https://'));
}
