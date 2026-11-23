'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import ListingForm from '@/components/ListingForm';
import type { Listing } from '@/lib/types';

export default function EditListingPage() {
  const params = useParams();
  const id = String(params.id);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setListing((data ?? null) as Listing | null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p>Loading…</p>;
  if (!listing) return <p>Listing not found.</p>;
  return (
    <div>
      <h1>Edit listing</h1>
      <ListingForm initial={listing} />
    </div>
  );
}
