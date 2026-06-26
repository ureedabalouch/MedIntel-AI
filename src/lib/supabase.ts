import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Returns the initialized Supabase client, or null if the credentials are not set yet.
 * Uses lazy initialization to prevent any app crashes or compilation failures during startup.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return null instead of crashing, so the simulator fallback can continue working smoothly
    return null;
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

/**
 * Helper utility to determine whether a real Supabase backend is configured.
 */
export function isSupabaseConfigured(): boolean {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}
