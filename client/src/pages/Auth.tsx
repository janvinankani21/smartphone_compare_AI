import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, API_URL } from '../context/AppContext';
import { Sparkles, User, Mail, Lock, ShieldAlert, ArrowRight } from 'lucide-react';

export const Auth: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    const payload = isRegister 
      ? { email, password, full_name: name }
      : { email, password };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        // Success
        login({ user: data.user, token: data.token });
        navigate(data.user.role === 'admin' ? '/admin' : '/');
      } else {
        setErrorMsg(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to establish contact with authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMock = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'google_user@gmail.com',
          full_name: 'Google User',
          avatar_url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=google'
        })
      });

      const data = await res.json();
      if (res.ok) {
        login({ user: data.user, token: data.token });
        navigate('/');
      } else {
        setErrorMsg(data.error || 'Google login failed');
      }
    } catch (err) {
      setErrorMsg('Failed to process Google mock auth.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12 text-left">
      <div className="glass-panel overflow-hidden rounded-3xl p-6 md:p-8">
        <div className="text-center">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Sparkles className="h-4.5 w-4.5" />
          </span>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-white font-sans">
            {isRegister ? 'Create your Account' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            {isRegister ? 'Sign up to write reviews and wishlist devices' : 'Sign in to access review panel & wishlist'}
          </p>
        </div>

        {/* Error notice */}
        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-semibold text-rose-400">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-secondary/40 py-2.5 pl-10 pr-4 text-white outline-none focus:border-accent"
                />
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Email Address</label>
            <div className="relative mt-1">
              <input
                type="email"
                required
                placeholder="e.g. user@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/40 py-2.5 pl-10 pr-4 text-white outline-none focus:border-accent"
              />
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Password</label>
            <div className="relative mt-1">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/40 py-2.5 pl-10 pr-4 text-white outline-none focus:border-accent"
              />
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-3 text-xs font-bold text-black hover:bg-neutral-200 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <hr className="my-6 border-border" />

        {/* Social Mock Buttons */}
        <button
          onClick={handleGoogleMock}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary/25 py-2.5 text-xs font-semibold text-white hover:bg-secondary transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.75 21.56,11.4 21.35,11.1z" fill="#4285F4" />
              <path d="M12,20.58c2.43,0 4.47,-0.8 5.96,-2.2l-3.3,-2.58c-0.9,0.6 -2.07,0.97 -3.3,0.97 -2.34,0 -4.33,-1.58 -5.04,-3.7H2.89v2.66C4.38,18.73 7.97,20.58 12,20.58z" fill="#34A853" />
              <path d="M6.96,13.07c-0.18,-0.55 -0.28,-1.13 -0.28,-1.73s0.1,-1.18 0.28,-1.73V6.95H2.89C2.3,8.14 2,9.47 2,10.84s0.3,2.7 0.89,3.89l4.07,-3.66z" fill="#FBBC05" />
              <path d="M12,5.2c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,2.44 14.42,1.64 12,1.64c-4.03,0 -7.62,1.85 -9.11,4.91l4.07,3.66C7.67,6.78 9.66,5.2 12,5.2z" fill="#EA4335" />
            </g>
          </svg>
          Continue with Google
        </button>

        {/* Toggle link */}
        <div className="mt-6 text-center text-xs">
          <span className="text-muted-foreground">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
          </span>{' '}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg('');
            }}
            className="font-bold text-accent hover:underline"
          >
            {isRegister ? 'Login' : 'Register Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
