
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      // safe-session-policy: We use localStorage to persist the session across browser restarts.
      // Ideally, for highly sensitive apps, sessionStorage would be preferred to clear on close,
      // but for this productivity tool, user convenience (staying logged in) is prioritized.
      // We mitigate risks via the Max Session Age check in authService.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      fetch: async (url, options) => {
        const response = await fetch(url, options);

        if (response.status === 401) {
          // Dispatch a custom event that AuthContext can listen to
          // We also set a flag so the login screen knows WHY the user was responsible
          console.warn('Global fetch interceptor caught 401. Triggering logout sequence.');
          localStorage.setItem('auth_session_expired', 'true');
          window.dispatchEvent(new Event('supabase:auth:401'));
        }

        return response;
      }
    }
  }
);

if (import.meta.env.DEV) {
  console.warn("Warning: Using Production Database with Local Persistence. Sign out to clear tokens before switching project configurations.");
}
