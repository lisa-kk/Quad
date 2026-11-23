'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { MEETUP_PROMPTS, type Message } from '@/lib/types';

export default function MessageThread({
  conversationId,
  myId,
}: {
  conversationId: string;
  myId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    setMessages((data ?? []) as Message[]);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  async function send(text?: string) {
    const textToSend = (text ?? body).trim();
    if (!textToSend) return;
    setError('');
    const { error: err } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: myId,
      body: textToSend,
    });
    if (err) {
      setError(err.message);
      return;
    }
    setBody('');
    await load();
  }

  return (
    <div className="card">
      <div className="messages">
        {messages.length === 0 && (
          <p className="muted">No messages yet — say hi and agree a meetup spot.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.sender_id === myId ? 'msg mine' : 'msg theirs'}>
            {m.body}
          </div>
        ))}
      </div>
      <div className="prompts">
        {MEETUP_PROMPTS.map((p) => (
          <button key={p} type="button" className="chip" onClick={() => send(p)}>
            {p}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      <form
        className="msg-form"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message…" />
        <button className="btn btn-primary" type="submit">
          Send
        </button>
      </form>
      <p className="muted">Meet in a public place on campus. Pay in person.</p>
    </div>
  );
}
