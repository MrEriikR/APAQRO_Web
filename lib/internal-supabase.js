import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const INTERNAL_EMAIL = 'equipo-interno@apaqro.org';
export const INTERNAL_STORAGE_KEY = 'apaqro-interno-session';

// A separate session keeps the public adoption catalog anonymous.
export const internalSupabase = url && key ? createClient(url, key, {
  auth: {
    storageKey: INTERNAL_STORAGE_KEY,
    storage: typeof window === 'undefined' ? undefined : window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: (input, options = {}) => fetch(input, {
      ...options,
      signal: AbortSignal.any([options.signal, AbortSignal.timeout(60000)].filter(Boolean)),
    }),
  },
}) : null;
