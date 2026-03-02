
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase URL and Anon Key are missing. Please check your .env file.');
}

export const isConfigured = 
  SUPABASE_URL && 
  !SUPABASE_URL.includes('YOUR_PROJECT_ID') && 
  !SUPABASE_URL.includes('placeholder') &&
  SUPABASE_ANON_KEY && 
  !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY') &&
  !SUPABASE_ANON_KEY.includes('placeholder');

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co', 
  SUPABASE_ANON_KEY || 'placeholder-key'
);
