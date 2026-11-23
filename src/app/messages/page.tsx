'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import type { Conversation } from '@/lib/types';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('conversations')
        .select('*, listing:listings(*)')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      setConversations((data ?? []) as Conversation[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p>Loading…</p>;
  return (
    <div className="stack">
      <h1>Messages</h1>
      {conversations.length === 0 && (
        <p className="muted">
          No conversations yet. Find a listing and tap “Message seller”.
        </p>
      )}
      {conversations.map((c) => (
        <Link key={c.id} href={`/messages/${c.id}`} className="card">
          {c.listing?.title ?? 'Listing'} — {c.listing?.pickup_spot ?? ''}
        </Link>
      ))}
    </div>
  );
}
