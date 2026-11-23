'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatPrice, type Listing } from '@/lib/types';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const [listing, setListing] = useState<Listing | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      setMyId(userData.user?.id ?? null);
      const { data, error: err } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();
      if (err) setError(err.message);
      setListing((data ?? null) as Listing | null);
      setLoading(false);
    }
    load();
  }, [id]);

  async function messageSeller() {
    if (!myId) {
      router.push('/auth');
      return;
    }
    if (!listing) return;
    if (myId === listing.seller_id) return;
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listing.id)
      .eq('buyer_id', myId)
      .maybeSingle();
    if (existing) {
      router.push(`/messages/${existing.id}`);
      return;
    }
    const { data, error: err } = await supabase
      .from('conversations')
      .insert({ listing_id: listing.id, buyer_id: myId, seller_id: listing.seller_id })
      .select('id')
      .single();
    if (err) {
      setError(err.message);
      return;
    }
    router.push(`/messages/${data.id}`);
  }

  async function report() {
    if (!myId || !listing) return;
    const reason = reportReason.trim() || 'Reported for review';
    const { error: err } = await supabase
      .from('reports')
      .insert({ listing_id: listing.id, reporter_id: myId, reason });
    if (err) setError(err.message);
    else setReportReason('');
  }

  if (loading) return <p>Loading…</p>;
  if (error || !listing) return <p className="error">{error || 'Listing not found.'}</p>;

  const isMine = myId === listing.seller_id;

  return (
    <div className="stack">
      {listing.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={listing.photo_url} alt={listing.title} className="detail-photo" />
      )}
      <div className="card">
        <div className="row">
          <span className="price">{formatPrice(listing.price)}</span>
          <span className="badge">{listing.status}</span>
        </div>
        <h1>{listing.title}</h1>
        <p className="muted">
          {listing.condition.replace('_', ' ')} · {listing.category} · Pickup: {listing.pickup_spot}
        </p>
        <p>{listing.description}</p>
        <div className="safety">
          Meet in a public place on campus. Check the item before you pay in person.
        </div>
        {!isMine && (
          <button className="btn btn-primary" onClick={messageSeller} type="button">
            Message seller
          </button>
        )}
        {isMine && (
          <Link href="/my-listings" className="btn btn-primary">
            Manage this listing
          </Link>
        )}
      </div>
      {!isMine && myId && (
        <div className="card">
          <h3>Report this listing</h3>
          <div className="row">
            <input
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Reason (optional)"
              aria-label="Report reason"
            />
            <button className="btn btn-ghost" onClick={report} type="button">
              Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
