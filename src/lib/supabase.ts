import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  !supabaseUrl.includes('your-project-id')
);

// Fallback dummy credentials when real credentials are not supplied yet
// to prevent runtime instantiation errors in the browser
const safeUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const safeKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

if (!isSupabaseConfigured) {
  console.info(
    'ElderCare: Supabase is in preview mode with local state. To connect live Supabase, configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}
