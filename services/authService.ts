import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

export const authService = {
  mapSessionToUser(session: Session | null): UserProfile | null {
    if (!session || !session.user) return null;
    const metadata = session.user.user_metadata || {};
    return {
      uid: session.user.id,
      displayName: metadata.full_name || session.user.email || 'User',
      email: session.user.email || null,
      photoURL: metadata.avatar_url || null,
      isAnonymous: session.user.is_anonymous || false,
    };
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    console.log('authService: Getting current user...');

    // safe-session-policy: Get session directly to inspect details
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('authService: Error getting session:', error);
      return null;
    }

    if (!session) return null;

    // safe-session-policy: 1. Check if Supabase thinks it's expired (though getSession usually handles refresh)
    if (session.expires_at && session.expires_at * 1000 < Date.now()) {
      console.warn('authService: Session expired according to expires_at. Signing out.');
      await this.signOut();
      return null;
    }

    // safe-session-policy: 2. Check "Max Session Age" to force re-login periodically (e.g., 72 hours)
    // We use the JWT's 'iat' (issued at) claim as a proxy for session start if available, 
    // or just rely on the session survival. Note: 'iat' updates on refresh in some flows, 
    // so strictly enforcing a "long lived" session limit requires persistent storage of initial login time.
    // For this implementation, we will assume if the refresh token is valid, we are good, 
    // BUT we enforce a hard check if we had a stored 'initial_login' timestamp (simplified here to just relying on token validity for now as standard Supabase behavior, 
    // but demonstrating the logic flow for the requirement).

    // Requirement specific: "If the current session was created more than 72 hours ago"
    // Since Supabase rotates access tokens, we look at the session last_refreshed or created_at if available? 
    // Standard session object doesn't always have "created_at". 
    // We will simulate this policy: If we can't determine age, we default to safe. 
    // Let's implement a logical check: 
    const MAX_SESSION_AGE = 72 * 60 * 60 * 1000; // 72 hours

    // In a real robust app, we'd store 'auth_login_timestamp' in localStorage on login.
    const loginTimestamp = localStorage.getItem('auth_login_timestamp');
    if (loginTimestamp) {
      const age = Date.now() - parseInt(loginTimestamp, 10);
      if (age > MAX_SESSION_AGE) {
        console.warn('authService: Max session age exceeded (72h). Enforcing fresh login.');
        localStorage.setItem('auth_session_expired', 'true');
        await this.signOut();
        return null;
      }
    } else {
      // If missing, set it now to start the clock for this device session
      localStorage.setItem('auth_login_timestamp', Date.now().toString());
    }

    return this.mapSessionToUser(session);
  },

  async signInGoogle(): Promise<UserProfile> {
    // safe-session-policy: Reset clock on fresh login attempt
    localStorage.setItem('auth_login_timestamp', Date.now().toString());

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw error;
    // Note: OAuth sign in redirects...
    return {
      uid: 'pending',
      displayName: 'Signing in...',
      email: null,
      photoURL: null,
      isAnonymous: false
    };
  },

  async signInWithEmail(email: string, pass: string): Promise<UserProfile> {
    console.log('Attempting sign in with:', email);

    // safe-session-policy: Reset clock on fresh login attempt
    localStorage.setItem('auth_login_timestamp', Date.now().toString());

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass
    });

    if (error) {
      if (error.name === 'AuthRetryableFetchError' || error.message.includes('Load failed') || error.message.includes('network')) {
        console.warn('Supabase auth network error (retrying possible):', error.message);
      } else {
        console.error('Supabase auth error:', error);
      }
      throw error;
    }

    if (!data.user) {
      console.error('No user returned from Supabase');
      throw new Error('No user returned');
    }

    const metadata = data.user.user_metadata || {};

    return {
      uid: data.user.id,
      displayName: metadata.full_name || data.user.email || 'User',
      email: data.user.email || null,
      photoURL: metadata.avatar_url || null,
      isAnonymous: false
    };
  },

  async signUpWithEmail(email: string, pass: string): Promise<UserProfile> {
    // safe-session-policy: Reset clock
    localStorage.setItem('auth_login_timestamp', Date.now().toString());

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass
    });
    if (error) throw error;
    if (!data.user) throw new Error('Sign up failed');

    return {
      uid: data.user.id,
      displayName: 'New User',
      email: data.user.email || email,
      photoURL: null,
      isAnonymous: false
    };
  },

  async updateProfile(updates: { displayName?: string; password?: string }): Promise<void> {
    const { displayName, password } = updates;
    const attrs: any = {};
    if (displayName) attrs.data = { full_name: displayName };
    if (password) attrs.password = password;

    const { error } = await supabase.auth.updateUser(attrs);
    if (error) throw error;
  },

  async signOut(): Promise<void> {
    // safe-session-policy: Bulletproof logout
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        // Only log warning if it's not a "session missing" error which is expected during cleanup
        if (error.message && !error.message.includes('AuthSessionMissingError')) {
          console.warn('authService: Supabase signOut failed, forcing local cleanup.', error);
        }
      }
    } catch (error: any) {
      // Ignore errors specifically related to missing sessions as we want to clean up anyway
      if (error?.message && !error.message.includes('AuthSessionMissingError')) {
        console.error('authService: Error during sign out:', error);
      }
    } finally {
      // safe-session-policy: Always force wipe local storage keys
      console.log('authService: Performing local session cleanup');
      localStorage.removeItem('auth_login_timestamp');

      // Wipe all sb- keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
    }
  }
};
