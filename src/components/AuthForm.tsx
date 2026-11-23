'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { isEduEmail } from '@/lib/types';

/**
 * Students-only signup / sign-in.
 * .edu email only — Gmail and other domains are rejected before
 * Supabase is even called. Supabase Auth then sends an email
 * verification link; the profile row is created on first sign-in.
 */
export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!isEduEmail(email)) {
      setError('Students only — please use your college .edu email. Gmail is not accepted.');
      return;
    }
    if (password.length < 6) {
      setError('Password needs at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        setNotice('Check your .edu inbox for the verification link, then sign in.');
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        window.location.href = '/';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card form">
      <h2>{mode === 'signup' ? 'Join Quad' : 'Welcome back'}</h2>
      <p className="muted">Students only — one network per college, verified by .edu email.</p>
      <label>
        College email (.edu)
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@oru.edu"
          required
        />
      </label>
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {error && <p className="error">{error}</p>}
      {notice && <p className="notice">{notice}</p>}
      <button className="btn btn-primary" disabled={busy} type="submit">
        {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
      </button>
      <button
        className="btn btn-ghost"
        type="button"
        onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
      >
        {mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create an account'}
      </button>
    </form>
  );
}
