'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import MessageThread from '@/components/MessageThread';

export default function ConversationPage() {
  const params = useParams();
  const id = String(params.id);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, []);

  if (!myId) return <p>Please sign in to view messages.</p>;
  return (
    <div>
      <h1>Conversation</h1>
      <MessageThread conversationId={id} myId={myId} />
    </div>
  );
}
