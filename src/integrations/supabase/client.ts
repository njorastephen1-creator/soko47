import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://khonaidacpdeyptxenkl.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_dO6jBGRsrSR-1B5ZABelUg_qObUlWGa';
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
});