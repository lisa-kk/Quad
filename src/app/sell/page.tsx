'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import ListingForm from '@/components/ListingForm';

export default function SellPage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
  }, []);

  if (signedIn === false) {
    return (
      <div className="card">
        <h2>Sign in to sell</h2>
        <p>Only students with a .edu email can post a listing.</p>
        <Link href="/auth" className="btn btn-primary">
          Sign up with .edu
        </Link>
      </div>
    );
  }
  if (signedIn === null) return <p>Loading…</p>;

  return (
    <div>
      <h1>Sell something</h1>
      <ListingForm />
    </div>
  );
}
