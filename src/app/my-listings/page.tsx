'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatPrice, type Listing, type ListingStatus } from '@/lib/types';

export default function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setLoading(false);
      return;
    }
    const { data, error: err } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    setListings((data ?? []) as Listing[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStatus(listing: Listing, status: ListingStatus) {
    const { error: err } = await supabase
      .from('listings')
      .update({ status })
      .eq('id', listing.id);
    if (err) setError(err.message);
    else await load();
  }

  async function remove(listing: Listing) {
    if (!window.confirm(`Delete “${listing.title}”?`)) return;
    const { error: err } = await supabase.from('listings').delete().eq('id', listing.id);
    if (err) setError(err.message);
    else await load();
  }

  if (loading) return <p>Loading…</p>;
  return (
    <div className="stack">
      <h1>My listings</h1>
      {error && <p className="error">{error}</p>}
      {listings.length === 0 && (
        <p className="muted">
          You have no listings yet. <Link href="/sell">Post your first one</Link>.
        </p>
      )}
      {listings.map((l) => (
        <div key={l.id} className="card">
          <div className="row">
            <strong>{l.title}</strong>
            <span className="price">{formatPrice(l.price)}</span>
            <span className="badge">{l.status}</span>
          </div>
          <p className="muted">{l.pickup_spot}</p>
          <div className="row">
            <Link href={`/listings/${l.id}`} className="btn btn-ghost">
              View
            </Link>
            <Link href={`/my-listings/${l.id}/edit`} className="btn btn-ghost">
              Edit
            </Link>
            {l.status !== 'sold' && (
              <button className="btn btn-primary" onClick={() => setStatus(l, 'sold')} type="button">
                Mark sold
              </button>
            )}
            {l.status === 'sold' && (
              <button className="btn btn-ghost" onClick={() => setStatus(l, 'available')} type="button">
                Mark available
              </button>
            )}
            <button className="btn btn-danger" onClick={() => remove(l)} type="button">
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
