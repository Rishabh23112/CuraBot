import { AlertCircle, ArrowLeft, Loader2, MapPin } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import GlassCard from '../components/GlassCard';
import { loginUser, registerUser, verifyGoogleToken } from '../services/api';
import { Page, User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  onNavigate: (page: Page) => void;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const Login: React.FC<LoginProps> = ({ onLogin, onNavigate }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const googleInitialized = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8;
    }
  }, []);

  useEffect(() => {
    // Always load Google script on mount
    if (GOOGLE_CLIENT_ID) {
      loadGoogleScript();
    }
  }, []);

  const loadGoogleScript = () => {
    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }

    if (scriptLoadedRef.current) return;

    const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existingScript) {
      const checkLoaded = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkLoaded);
          initializeGoogle();
        }
      }, 100);
      setTimeout(() => clearInterval(checkLoaded), 5000); // Timeout after 5s
      return;
    }

    scriptLoadedRef.current = true;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setTimeout(initializeGoogle, 200);
    };
    script.onerror = () => {
      console.warn('Failed to load Google Sign-In');
      setError('Failed to load Google Sign-In. Please try email login.');
    };
    document.head.appendChild(script);
  };

  const initializeGoogle = () => {
    if (!window.google?.accounts?.id || googleInitialized.current) return;

    try {
      googleInitialized.current = true;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      setIsGoogleReady(true);
      console.log('Google Sign-In initialized successfully');
    } catch (err) {
      console.error('Google init error:', err);
      setError('Failed to initialize Google Sign-In');
    }
  };

  const handleGoogleSignIn = () => {
    if (!window.google?.accounts?.id) {
      loadGoogleScript();
      setTimeout(() => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.prompt();
        } else {
          setError('Google Sign-In is not available. Please check your internet connection or try email login.');
        }
      }, 1500);
    } else {
      window.google.accounts.id.prompt();
    }
  };

  const handleGoogleCallback = async (response: { credential: string }) => {
    if (!response.credential) {
      setError('No credential received from Google');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const authResponse = await verifyGoogleToken(response.credential);

      if (authResponse.success && authResponse.user) {
        const user: User = {
          id: authResponse.user.id,
          name: authResponse.user.name,
          email: authResponse.user.email,
          avatar: authResponse.user.avatar,
          token: response.credential,
        };
        onLogin(user);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let authResponse;

      if (isLogin) {
        // Login
        authResponse = await loginUser(email, password);
      } else {
        // Register
        if (!name.trim()) {
          throw new Error('Name is required');
        }
        authResponse = await registerUser(email, password, name);
      }

      if (authResponse.success && authResponse.user) {
        const user: User = {
          id: authResponse.user.id,
          name: authResponse.user.name,
          email: authResponse.user.email,
          avatar: authResponse.user.avatar,
          address: address || undefined,
          token: authResponse.token,
        };
        onLogin(user);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-slate-900 overflow-hidden">
      {/* Background Video */}
      <div className="fixed inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-70"
          poster="https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=2070&auto=format&fit=crop"
        >
          <source src="https://www.pexels.com/video/a-placid-lake-under-cloudy-sky-5550288/.mp4" type="video/mp4" />
        </video>
        {/* Lighter overlay to let video show through */}
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"></div>

        {/* Decorative blobs */}
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px] mix-blend-screen"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[100px] mix-blend-screen"></div>
      </div>

      <button
        onClick={() => onNavigate(Page.HOME)}
        className="absolute top-6 left-6 text-white/50 hover:text-white flex items-center gap-2 transition-colors z-20"
      >
        <ArrowLeft size={20} /> Back to Home
      </button>

      <GlassCard className="w-full max-w-md p-8 z-10 !bg-slate-900/60 !border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-purple-500/30">
            CB
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">{isLogin ? 'Welcome Back' : 'Join CuraBot'}</h2>
          <p className="text-gray-400">Your journey to mental wellness starts here.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-medium py-3 px-4 rounded-xl shadow hover:shadow-md transition-all mb-4 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-gray-500 text-xs uppercase">Or</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        {/* Hidden container for Google SDK button */}
        <div ref={buttonContainerRef} className="hidden"></div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500/50 transition-colors"
                    placeholder="Your name"
                    required={!isLogin}
                  />
                </div>
                <div className="w-12 h-12 mb-0.5 rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 to-purple-500 shadow-lg shadow-purple-500/20 shrink-0">
                  <img
                    src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${name || 'Friend'}`}
                    alt="Preview"
                    className="w-full h-full rounded-full bg-slate-800 object-cover"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Address (Optional)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-cyan-500/50 transition-colors"
                    placeholder="City, Country"
                  />
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500/50 transition-colors"
              placeholder="Enter your email"
              autoComplete="off"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500/50 transition-colors"
              placeholder="Enter your password"
              autoComplete="new-password"
              required
              minLength={6}
            />
            {!isLogin && (
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-[1.02] mt-4 flex justify-center items-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default Login;