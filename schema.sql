-- Quad — Supabase schema
-- Run this in Supabase Dashboard > SQL Editor > New query, then Run.
-- It is safe to run once on a fresh project. It creates the tables,
-- the RLS policies, and the listing-photos storage bucket.
-- This replaces Quad-2's Hatch-specific server (ctx.db / app.db).
-- No in-app payments in this MVP. The payment-ready columns are:
--   profiles.stripe_account_id (nullable) and listings.status
--   (available | sold | reserved). Add Stripe Connect later without
--   rebuilding the tables.

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- Enums ----------
do $$ begin
  create type listing_category as enum
    ('textbooks', 'electronics', 'clothing', 'dorm', 'sports', 'tickets', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type listing_condition as enum
    ('new', 'like_new', 'good', 'fair');
exception when duplicate_object then null; end $$;

do $$ begin
  create type listing_status as enum ('available', 'reserved', 'sold');
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------
-- One row per student. id matches auth.users.id.
-- email must end in .edu — enforced in the app on signup AND here
-- as a check constraint, so a non-.edu row cannot be inserted directly.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique
    check (lower(email) like '%@%.edu'),
  display_name text,
  college text,
  -- Payment-ready: nullable Stripe Connect account id, filled in later.
  -- Leave null in the MVP. Never store card numbers here.
  stripe_account_id text,
  created_at timestamptz not null default now()
);

-- ---------- listings ----------
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) >= 2),
  description text not null default '',
  -- Price as a number (dollars). Keep it numeric so Stripe can use it later.
  price numeric(10, 2) not null check (price >= 0),
  category listing_category not null default 'other',
  condition listing_condition not null default 'good',
  pickup_spot text not null,
  photo_url text,
  -- Order/status field for later: available -> reserved -> sold.
  -- MVP flow is meet on campus and pay in person, then mark sold.
  status listing_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists listings_seller_idx on public.listings (seller_id);
create index if not exists listings_status_created_idx
  on public.listings (status, created_at desc);
create index if not exists listings_category_idx on public.listings (category);

-- ---------- conversations ----------
-- One conversation per (listing, buyer). The seller is the listing owner.
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id)
);
create index if not exists conversations_buyer_idx on public.conversations (buyer_id);
create index if not exists conversations_seller_idx on public.conversations (seller_id);

-- ---------- messages ----------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) >= 1),
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at asc);

-- ---------- reports ----------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;

-- profiles: anyone signed in can read profiles; only you can edit your own.
drop policy if exists "profiles readable by signed-in users" on public.profiles;
create policy "profiles readable by signed-in users"
  on public.profiles for select to authenticated using (true);

drop policy if exists "profiles editable by owner" on public.profiles;
create policy "profiles editable by owner"
  on public.profiles for all to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- listings: available listings are public to signed-in students;
-- only the seller can insert / update / delete their own.
drop policy if exists "listings readable by signed-in users" on public.listings;
create policy "listings readable by signed-in users"
  on public.listings for select to authenticated using (true);

drop policy if exists "listings insertable by seller" on public.listings;
create policy "listings insertable by seller"
  on public.listings for insert to authenticated
  with check (auth.uid() = seller_id);

drop policy if exists "listings editable by seller" on public.listings;
create policy "listings editable by seller"
  on public.listings for update to authenticated
  using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

drop policy if exists "listings deletable by seller" on public.listings;
create policy "listings deletable by seller"
  on public.listings for delete to authenticated using (auth.uid() = seller_id);

-- conversations: only the buyer or the seller in that conversation.
drop policy if exists "conversations visible to participants" on public.conversations;
create policy "conversations visible to participants"
  on public.conversations for select to authenticated
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists "conversations insertable by buyer" on public.conversations;
create policy "conversations insertable by buyer"
  on public.conversations for insert to authenticated
  with check (auth.uid() = buyer_id);

-- messages: only participants of the conversation can read / send.
drop policy if exists "messages visible to participants" on public.messages;
create policy "messages visible to participants"
  on public.messages for select to authenticated using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

drop policy if exists "messages insertable by participants" on public.messages;
create policy "messages insertable by participants"
  on public.messages for insert to authenticated with check (
    auth.uid() = sender_id and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- reports: anyone signed in can file one; only the reporter sees their own.
drop policy if exists "reports insertable by signed-in users" on public.reports;
create policy "reports insertable by signed-in users"
  on public.reports for insert to authenticated
  with check (auth.uid() = reporter_id);

drop policy if exists "reports readable by reporter" on public.reports;
create policy "reports readable by reporter"
  on public.reports for select to authenticated using (auth.uid() = reporter_id);

-- ---------- Storage: listing photos ----------
-- Bucket: listing-photos (public read, so listing cards can show images).
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

-- Anyone signed in can upload a photo; anyone can view it.
drop policy if exists "listing photos readable by anyone" on storage.objects;
create policy "listing photos readable by anyone"
  on storage.objects for select using (bucket_id = 'listing-photos');

drop policy if exists "listing photos uploadable by signed-in users" on storage.objects;
create policy "listing photos uploadable by signed-in users"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-photos');

drop policy if exists "listing photos deletable by uploader" on storage.objects;
create policy "listing photos deletable by uploader"
  on storage.objects for delete to authenticated
  using (bucket_id = 'listing-photos' and owner = auth.uid());
