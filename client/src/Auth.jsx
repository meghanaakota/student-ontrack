import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.currentUser()
      .then(({ user: currentUser }) => {
        if (active) setUser(currentUser);
      })
      .catch((requestError) => {
        if (active && requestError.status !== 401) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    async signIn(credentials) {
      const result = await api.login(credentials);
      setError('');
      setUser(result.user);
    },
    async signUp(credentials) {
      const result = await api.register(credentials);
      setError('');
      setUser(result.user);
    },
    async signOut() {
      await api.logout();
      setUser(null);
      setError('');
    },
  }), [user, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used within AuthProvider.');
  return auth;
}

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="auth-status">Checking your account…</p>;
  return user ? children : <Navigate to="/login" replace />;
}

export function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { user, loading, signIn, signUp, error: authError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <p className="auth-status">Checking your account…</p>;
  if (user) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    setFormError('');
    setBusy(true);
    try {
      await (isRegister ? signUp({ email, password }) : signIn({ email, password }));
      navigate('/', { replace: true });
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="muted">
          {isRegister ? 'Create a private planner and attendance tracker.' : 'Sign in to your planner and attendance tracker.'}
        </p>
        {(authError || formError) && <div className="alert" role="alert">{formError || authError}</div>}
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            maxLength="254"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            minLength={isRegister ? 12 : undefined}
            maxLength="128"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {isRegister && <span className="hint">Use at least 12 characters.</span>}
        </label>
        <button className="primary" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
        </button>
        <p className="muted">
          {isRegister ? 'Already have an account?' : 'New to Student OnTrack?'}{' '}
          <Link to={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </form>
    </section>
  );
}
