
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, UserProfile } from '../types';
import { authService } from './authService';
import { supabase } from '../lib/supabase';

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => {
            console.warn('AuthProvider: Session check timed out');
            resolve(null);
          }, 3000)
        );

        // Safe Session Policy: authService.getCurrentUser() now performs age/expiry checks
        const userPromise = authService.getCurrentUser();
        const u = await Promise.race([userPromise, timeoutPromise]);

        if (mounted) {
          console.log('AuthProvider: Initial session check complete', u?.uid);
          setUser(u);
          setLoading(false);

          // Redirect if no user and trying to access protected route (checking hash for simplicity)
          if (!u && window.location.hash && window.location.hash !== '#login' && window.location.hash !== '#signup') {
            // Let the specific page handle redirect or do it here. 
            // Ideally, App routing handles this, but we force clean state here.
          }
        }
      } catch (error) {
        console.error("AuthProvider: Initial check failed", error);
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    // 2. Global Auth Listener
    // safe-session-policy: This is the single source of truth for session state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider: onAuthStateChange event:', event);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const u = authService.mapSessionToUser(session);
        if (mounted) {
          setUser(u);
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null);
          setLoading(false);
          // safe-session-policy: Immediate redirect on logout/revocation
          if (window.location.hash !== '#login' && window.location.hash !== '#signup') {
            window.location.hash = 'login';
          }
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);



  const signInGoogle = async () => {
    setLoading(true);
    const u = await authService.signInGoogle();
    setUser(u);
    setLoading(false);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const u = await authService.signInWithEmail(email, pass);
      window.location.hash = 'dashboard';
      setUser(u);
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const u = await authService.signUpWithEmail(email, pass);
      window.location.hash = 'dashboard';
      setUser(u);
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      // Race condition protection: if signOut takes too long, force local cleanup
      const signOutPromise = authService.signOut();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Sign out timed out')), 2000));

      await Promise.race([signOutPromise, timeoutPromise]);
    } catch (e) {
      console.warn("Sign out may have been incomplete or timed out:", e);
    } finally {
      // Ensure local state is cleared regardless of service success/failure 
      window.location.hash = ''; // Clear hash first
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInGoogle, signInWithEmail, signUpWithEmail, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
