import { createClient } from '@supabase/supabase-js';
import type { Database } from './types.ts';

const supabaseURL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseANONKEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseURL || !supabaseANONKEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient<Database>(supabaseURL, supabaseANONKEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});