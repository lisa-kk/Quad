# PORTING_NOTES — Quad-2 → portable-quad

Quad-2 is the Muse space version (live v3). It works inside Muse, but
its server is Hatch-specific, so it cannot be copied to GitHub / Vercel
as-is. This folder is a rebuild of the same MVP on a portable stack:
Next.js App Router + TypeScript + Supabase (Auth, Postgres, Storage),
ready for Vercel.

## What was copied from Quad-2 (features & branding)

- Students-only signup: `.edu` email only, Gmail rejected, email
  verification. Same rule, now enforced in the app (`isEduEmail`) and
  in the database (check constraint on `profiles.email`).
- Browse / search listings with category and condition filters.
- Post a listing: photo, title, price, condition, description,
  campus pickup spot.
- Message the seller: listing-tied conversations, quick meetup prompts
  (“Hi! Is this still available?”, “Can we meet at the Student Center
  today?”, “What time works for pickup?”).
- Manage own listings: edit, mark sold / available, delete.
- Report a listing.
- Meet on campus and pay in person — **no in-app payments**.
- Branding: dark green `#1b4332` for sustainability, light sage
  background `#eef4ec`, hero line “Buy & sell with your campus.”
- Pickup spots (no building names invented):
  Student Center, Library entrance, Dorm lobby, Chapel steps,
  Cafeteria, Gym entrance.
- Safety banner: meet in a public place on campus, check the item
  before paying.

## What changed for portability

| Quad-2 (Muse space) | portable-quad (this folder) |
| --- | --- |
| Hatch server actions (`ctx.db`, SQLite via Drizzle, `ctx.blobs`) | Supabase Postgres + Supabase Storage (`listing-photos` bucket) |
| Hatch-managed auth / profiles | Supabase Auth (email + password, email verification) + `public.profiles` table linked to `auth.users.id` |
| Data in `app.db` inside the space | `supabase/schema.sql` — run it once in Supabase SQL Editor |
| No public link (space only) | Next.js app, deployable to Vercel from GitHub |
| Storage access that crashed on some devices (fixed in Quad-2 v3 with safe-storage helpers) | No localStorage for app data at all — state lives in Supabase; auth session is managed by the Supabase client |
| External Google Fonts `@import` (caused the black screen in Quad-2) | No external fonts — system font stack only |

## Payment-ready, not payment-built

Kept from the MVP plan, so Stripe Connect can be added later without
rebuilding:

- `listings.price` is `numeric(10,2)` — a number, not text.
- `profiles.stripe_account_id` is nullable text — filled in when a
  seller onboards with Stripe Connect.
- `listings.status` is an enum: `available` / `reserved` / `sold` —
  the order/status field a checkout flow will move through later.

No Stripe keys, no checkout code, and no card handling in this copy.

## What was NOT copied

- No test / probe data. This copy starts empty — no listings, no
  users, no messages. Quad-2's test listings stayed in its test data.
- No Hatch-specific code, config, or database files.
- No real secrets. `.env.example` has placeholders only.

## Known limits of this portable copy

- Auth is email + password via Supabase Auth. There is no
  per-college network split yet — the `.edu` check is the gate, and
  `profiles.college` is a free-text field for now. The per-college
  network idea (one network per school, like Fizz) is a later step:
  derive the college from the email domain and filter listings by it.
- Editing a listing re-uses the sell form; deleting a listing does
  not delete its photo from Storage (the row is gone, the file stays).
- Messages use Supabase Realtime for live updates; if Realtime is
  off, the thread still reloads after sending.
- No admin / moderation dashboard yet — reports are stored in the
  `reports` table for a human to review in Supabase.
