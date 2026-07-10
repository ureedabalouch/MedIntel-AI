import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Validates if the provided Supabase credentials are valid and not placeholders.
 */
function isValidSupabaseConfig(url: string | undefined, key: string | undefined): boolean {
  if (!url || !key) return false;
  
  const trimmedUrl = url.trim();
  const trimmedKey = key.trim();
  
  if (trimmedUrl === '' || trimmedKey === '') return false;
  
  const lowerUrl = trimmedUrl.toLowerCase();
  const lowerKey = trimmedKey.toLowerCase();
  
  // Check for common placeholders
  if (
    lowerUrl.includes('your-project') ||
    lowerUrl.includes('placeholder') ||
    lowerUrl.includes('your-supabase-url') ||
    lowerUrl.includes('example.com') ||
    lowerUrl.startsWith('your_') ||
    lowerUrl.startsWith('your-') ||
    trimmedUrl === 'YOUR_SUPABASE_URL' ||
    !lowerUrl.startsWith('http')
  ) {
    return false;
  }
  
  if (
    lowerKey.includes('placeholder') ||
    lowerKey.includes('your-anon-key') ||
    lowerKey.startsWith('your_') ||
    lowerKey.startsWith('your-') ||
    trimmedKey === 'YOUR_SUPABASE_ANON_KEY' ||
    lowerKey.length < 20 // Real Supabase keys are long JWTs
  ) {
    return false;
  }
  
  return true;
}

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

  if (!isValidSupabaseConfig(supabaseUrl, supabaseAnonKey)) {
    // Return null instead of crashing, so the simulator fallback can continue working smoothly
    return null;
  }

  try {
    supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!);
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
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return isValidSupabaseConfig(supabaseUrl, supabaseAnonKey);
}
