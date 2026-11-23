'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function Navbar() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <header className="nav">
      <Link href="/" className="brand">
        <span className="brand-mark">Q</span> Quad
      </Link>
      <nav className="nav-links">
        <Link href="/">Browse</Link>
        <Link href="/sell">Sell</Link>
        <Link href="/messages">Messages</Link>
        <Link href="/my-listings">My listings</Link>
        {email ? (
          <>
            <span className="nav-user">{email}</span>
            <button className="btn btn-ghost" onClick={signOut} type="button">
              Sign out
            </button>
          </>
        ) : (
          <Link href="/auth" className="btn btn-primary">
            Sign up with .edu
          </Link>
        )}
      </nav>
    </header>
  );
}
