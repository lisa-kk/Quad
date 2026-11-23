# Quad — portable copy

Quad is a students-only campus marketplace. One network per college,
verified by a `.edu` email — like Fizz, but for buying and selling on
campus. Students browse listings, post items with a photo, message the
seller, meet on campus, and pay in person.

**MVP scope:** no in-app payments yet. Prices are stored as numbers,
profiles have a nullable `stripe_account_id`, and listings have a
`status` field (`available` / `reserved` / `sold`), so Stripe Connect
can be added later without rebuilding the tables.

**Branding:** dark green (`#1b4332`) for sustainability, light sage
background (`#eef4ec`), hero line: **“Buy & sell with your campus.”**

## What is in this folder?

| Path | What it is |
| --- | --- |
| `src/app/` | Next.js App Router pages: browse, auth, sell, listing detail, messages, my listings |
| `src/components/` | Navbar, listing card, auth form, listing form, message thread |
| `src/lib/` | Supabase browser/server clients, shared types, categories, pickup spots |
| `supabase/schema.sql` | Postgres tables, RLS policies, listing-photos storage bucket |
| `.env.example` | The env vars you need — copy to `.env.local`, never commit secrets |
| `package.json` | Next.js 14 + React 18 + Supabase |
| `vercel.json` | Tells Vercel this is a Next.js app |

## Teach-first setup — do it in this order

### 0. What you need

- A GitHub account (Lisa already has one; git is **not** installed on her
  laptop yet — GitHub on the web works for the first steps)
- A free Supabase account (sign in with GitHub)
- A free Vercel account (sign in with GitHub)
- Node.js 18+ on your laptop, for running it locally (install later if
  you have not got it yet)

### 1. Push this code to GitHub

This folder is the code. Do **not** paste secrets into it.

```bash
# From inside portable-quad/ (on your laptop, once you have the files there):
git init
git add .
git commit -m "First commit: Quad MVP"
git branch -M main
git remote add origin https://github.com/<your-username>/quad.git
git push -u origin main
```

Your first real edit goes on a branch, so you can show the commit:

```bash
git checkout -b first-edit
# ... make one small edit, e.g. the hero line in src/app/page.tsx ...
git add .
git commit -m "Edit hero line"
git push -u origin first-edit
```

Then open a pull request on GitHub and merge it into `main`. That commit
is your LinkedIn proof.

### 2. Create a Supabase project and run the schema

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Name it `quad`, keep the **Free** plan, pick a region near you,
   set a database password you will remember.
3. Wait for the project to finish creating.
4. Go to **SQL Editor → New query**, paste in the whole contents of
   `supabase/schema.sql`, and click **Run**.
5. Check it worked: go to **Table Editor** — you should see
   `profiles`, `listings`, `conversations`, `messages`, `reports`.
6. Go to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Also check **Authentication → Providers → Email** is on, and that
email confirmation is on — that is how the `.edu` verification link
is sent. The app itself rejects non-`.edu` emails before signup, and
the database also rejects non-`.edu` profile rows.

### 3. Connect Vercel to GitHub and set the env vars

1. Go to [vercel.com](https://vercel.com) → **Add New → Project** →
   **Import** your `quad` GitHub repo.
2. Framework should be detected as **Next.js**. Leave the build
   settings as they are.
3. Before you deploy, add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
4. Click **Deploy**. Vercel builds the app and gives you a live link
   like `quad.vercel.app`.
5. Test the live link like a real user: sign up with a `.edu` email,
   post a listing, message it from a second account, mark it sold.

If a deploy fails, read the Vercel build log first — it usually names
the missing env var or the file with the error.

### 4. Add a domain later (not needed for the first launch)

Buy a domain (about $12/year), then in Vercel go to your project →
**Settings → Domains** → add it, and follow the DNS instructions
from your domain seller. The free `quad.vercel.app` link works fine
until then.

## Run it locally

```bash
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
npm install
npm run dev
# Open http://localhost:3000
```

Other useful commands:

```bash
npm run typecheck   # tsc --noEmit
npm run build       # next build (what Vercel runs)
npm start           # serve the production build locally
```

## Costs (agreed)

- Domain: ~$12/year
- Vercel hosting: ~$20/month once live (Pro, because a marketplace
  taking real users is commercial — the free Hobby plan is for
  personal, non-commercial use)
- Supabase: free to start; $25/month Pro only if you outgrow the free
  tier (500 MB database, 50,000 monthly active users, 1 GB file storage)
- Stripe: later only, per sale — 2.9% + 30¢ per card payment, plus
  Connect fees. Nothing to pay now.

Nothing is due now. Do not put a card into Supabase or Vercel until
you are ready to launch for real users.

## How the MVP works, in plain words

1. **Sign up:** type a `.edu` email + password. Gmail is rejected.
   Supabase sends a verification link to that inbox.
2. **Browse:** the home page lists available items. Search by word,
   filter by category and condition.
3. **Sell:** title, price, category, condition, pickup spot, photo.
   The photo is uploaded to Supabase Storage (`listing-photos`).
4. **Message:** tap “Message seller” on a listing. That opens a chat
   tied to that listing, with quick prompts like “Can we meet at the
   Student Center today?”
5. **Meet & pay:** agree a public campus spot in chat, check the item,
   pay in person (cash / Venmo / Cash App).
6. **Mark sold:** the seller marks it sold in My listings, so it
   leaves Browse. Sellers can also edit or delete their listings,
   and anyone can report a listing.

## Safety notes

- Meet in a public place on campus, in daylight if you can.
- Never share your password, and never paste a Supabase service-role
  key into the browser or into GitHub.
- RLS (Row Level Security) is on in `schema.sql`: you can only edit
  your own listings, and only the buyer/seller in a conversation can
  read its messages.
