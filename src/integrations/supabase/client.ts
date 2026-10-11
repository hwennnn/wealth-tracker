import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// The self-hosted PostgREST is served from the same origin at /rest/v1
// (Traefik in prod, the Vite proxy in dev), which is the path supabase-js expects.
const API_URL = window.location.origin;
// supabase-js requires a key, but PostgREST ignores the `apikey` header.
const API_KEY = "self-hosted";

export function createClerkSupabaseClient(getToken: () => Promise<string | null>) {
  return createClient<Database>(API_URL, API_KEY, {
    global: {
      fetch: async (url, options: RequestInit = {}) => {
        const token = await getToken();
        const headers = new Headers(options.headers);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        } else {
          headers.delete('Authorization');
        }
        return fetch(url, { ...options, headers });
      },
    },
  });
}
