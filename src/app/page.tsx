'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import ListingCard from '@/components/ListingCard';
import { CATEGORIES, CONDITIONS, type Listing } from '@/lib/types';

export default function BrowsePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [condition, setCondition] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured()) {
        setError('Supabase is not configured yet — add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local (see README.md).');
        setLoading(false);
        return;
      }
      const { data, error: err } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      if (err) setError(err.message);
      setListings((data ?? []) as Listing[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = listings.filter((l) => {
    if (category !== 'all' && l.category !== category) return false;
    if (condition !== 'all' && l.condition !== condition) return false;
    if (search && !`${l.title} ${l.description}`.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div>
      <section className="hero">
        <h1>Buy &amp; sell with your campus.</h1>
        <p>
          Quad is a students-only marketplace — one network per college, verified by .edu
          email. Meet on campus and pay in person.
        </p>
      </section>

      <div className="safety">
        Meet in a public place on campus. Check the item before you pay. No in-app
        payment yet — pay in person.
      </div>

      <div className="filters">
        <input
          type="search"
          placeholder="Search listings…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search listings"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select value={condition} onChange={(e) => setCondition(e.target.value)} aria-label="Condition">
          <option value="all">Any condition</option>
          {CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <Link href="/sell" className="btn btn-primary">
          Sell something
        </Link>
      </div>

      {loading && <p>Loading listings…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="muted">No listings yet — be the first to post one.</p>
      )}
      <div className="grid">
        {filtered.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
    </div>
  );
}
