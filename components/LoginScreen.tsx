import React from 'react';
import { useAuth } from '../services/authContext';
import { Command, ArrowRight, Mail, Lock, User } from 'lucide-react';
import { useState, useEffect } from 'react';

const EmailAuthForm = ({ loading }: { loading: boolean }) => {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  useEffect(() => {
    const expired = localStorage.getItem('auth_session_expired');
    if (expired === 'true') {
      setError('Your session has expired. Please sign in again.');
      localStorage.removeItem('auth_session_expired');
    }
  }, []);

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      {error && <div className="text-red-500 text-sm font-medium mb-2 bg-red-50 p-2 rounded">{error}</div>}

      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-workspace-text focus:ring-1 focus:ring-workspace-text outline-none transition-all"
          required
        />
      </div>

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-workspace-text focus:ring-1 focus:ring-workspace-text outline-none transition-all"
          required
          minLength={6}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-workspace-text text-white font-semibold py-3.5 px-6 rounded-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-70"
      >
        {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            if (!isSignUp) {
              setError('Sign up is not yet available.');
              return;
            }
            setIsSignUp(!isSignUp);
          }}
          className="text-sm text-workspace-secondary hover:text-workspace-text transition-colors"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </form>
  );
};

export const LoginScreen: React.FC = () => {
  const { signInGoogle, loading } = useAuth();

  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-workspace-sidebar">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-workspace-selection rounded-full blur-[120px]"></div>

      <div className="relative z-10 flex flex-col items-center p-8 md:p-12 w-full max-w-md bg-white border border-workspace-border rounded-3xl shadow-xl">
        <div className="mb-8 p-4 bg-workspace-accent rounded-2xl shadow-lg shadow-workspace-accent/20">
          <Command size={48} className="text-white" strokeWidth={2.5} />
        </div>

        <h1 className="text-3xl font-bold text-workspace-text mb-2 tracking-tight">AWY</h1>
        <p className="text-workspace-secondary mb-8 text-center leading-relaxed">
          Professional Modular Workspace Shell.
        </p>

        <div className="w-full space-y-4">
          <EmailAuthForm loading={loading} />

          {/* Google Login Disabled
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-workspace-secondary">Or continue with</span>
            </div>
          </div>

          <button
            onClick={signInGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-workspace-text font-semibold py-3.5 px-6 rounded-xl border border-workspace-border hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-70"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {loading ? 'Authenticating...' : 'Sign in with Google'}
          </button>
          */}
        </div>

        <p className="mt-8 text-[10px] text-workspace-secondary uppercase tracking-widest font-bold">
          Workspace v2.1.0
        </p>
      </div>
    </div>
  );
};