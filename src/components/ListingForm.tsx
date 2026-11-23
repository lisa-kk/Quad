'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  CATEGORIES,
  CONDITIONS,
  PICKUP_SUGGESTIONS,
  type Listing,
  type ListingCategory,
  type ListingCondition,
} from '@/lib/types';

interface Props {
  initial?: Listing | null;
}

/**
 * Create / edit a listing. Photo goes to Supabase Storage
 * (bucket: listing-photos); the listing row stores the public URL.
 * Price stays a number so Stripe can use it later.
 */
export default function ListingForm({ initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [category, setCategory] = useState<ListingCategory>(initial?.category ?? 'other');
  const [condition, setCondition] = useState<ListingCondition>(initial?.condition ?? 'good');
  const [pickupSpot, setPickupSpot] = useState(initial?.pickup_spot ?? PICKUP_SUGGESTIONS[0]);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setError('Please sign in with your .edu email first.');
      return;
    }
    const priceNum = Number(price);
    if (!title.trim() || Number.isNaN(priceNum) || priceNum < 0) {
      setError('Add a title and a valid price (0 or more).');
      return;
    }
    setBusy(true);
    try {
      let photoUrl = initial?.photo_url ?? null;
      if (photo) {
        const path = `${user.id}/${Date.now()}-${photo.name}`;
        const { error: uploadErr } = await supabase.storage
          .from('listing-photos')
          .upload(path, photo);
        if (uploadErr) throw uploadErr;
        const { data } = supabase.storage.from('listing-photos').getPublicUrl(path);
        photoUrl = data.publicUrl;
      }
      const payload = {
        seller_id: user.id,
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        category,
        condition,
        pickup_spot: pickupSpot,
        photo_url: photoUrl,
      };
      if (initial) {
        const { error: err } = await supabase
          .from('listings')
          .update(payload)
          .eq('id', initial.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('listings').insert(payload);
        if (err) throw err;
      }
      router.push('/my-listings');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the listing.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card form">
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Price ($)
        <input
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </label>
      <label>
        Category
        <select value={category} onChange={(e) => setCategory(e.target.value as ListingCategory)}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Condition
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value as ListingCondition)}
        >
          {CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Campus pickup spot
        <select value={pickupSpot} onChange={(e) => setPickupSpot(e.target.value)}>
          {PICKUP_SUGGESTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label>
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </label>
      <label>
        Photo
        <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn btn-primary" disabled={busy} type="submit">
        {busy ? 'Saving…' : initial ? 'Save changes' : 'Post listing'}
      </button>
      <p className="muted">Meet on campus and pay in person — no in-app payment yet.</p>
    </form>
  );
}
