# FOOTBALL_MEDIA

Next.js 14 + Tailwind + TypeScript football news site, content-driven by
`.mdx` files in `content/posts/`.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Local dev works fully on your machine, but
you don't actually need to run it locally to ship changes — Vercel builds
and deploys on every push (see below).

## Deploy to Vercel

1. Push this project to a new GitHub repo, e.g. `football-media`.
2. Go to vercel.com → **Add New Project** → import that repo.
3. Vercel auto-detects Next.js — no config needed. Click Deploy.
4. Under Project Settings → Environment Variables, add:
   - `CREATE_POST_TOKEN` — a long random string, shared with n8n
   - `GITHUB_TOKEN` — a GitHub personal access token with `repo` scope
   - `GITHUB_OWNER` — your GitHub username
   - `GITHUB_REPO` — the repo name (`football-media`)
   - `GITHUB_BRANCH` — usually `main`
   - `NEXT_PUBLIC_SITE_URL` — your real live URL once you know it, e.g.
     `https://football-media-news.vercel.app`

From then on, every `git push` to `main` triggers a new Vercel deploy
automatically — that's Vercel's own GitHub integration, so the
`.github/workflows/ci.yml` in here is just a build/lint check, not the
deploy step itself.

## Adding a post manually

Drop a new `.mdx` file into `content/posts/`, named `YYYY-MM-DD-slug.mdx`,
with this frontmatter:

```mdx
---
title: "Match headline here"
date: "2026-09-10T12:00:00.000Z"
excerpt: "One or two sentence summary shown on the homepage card."
image: "https://example.com/image.jpg"
category: "Premier League"
tags: ["optional", "tags"]
---

Article body in Markdown/MDX goes here.
```

Push to `main` — Vercel rebuilds and it's live.

## Comments (no GitHub account needed)

Comments are stored in the same Supabase project your n8n workflow
already uses — one new table, no new service.

1. In your Supabase project → SQL Editor, run:

```sql
create table comments (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null,
  name text not null,
  body text not null,
  created_at timestamptz not null default now()
);
```

2. In Vercel → Settings → Environment Variables, add:
   - `SUPABASE_URL` — your project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — from Supabase → Settings → API
     (the **service_role** key, not the anon key — this one stays
     server-side only and is never sent to visitors' browsers)
3. Redeploy. Anyone can then comment with just a name — no sign-in,
   no GitHub account required. Until these env vars are set, the
   comments section just shows "Comments aren't set up yet" instead
   of breaking.

There's no moderation UI here — comments post instantly. If spam
becomes a problem, the simplest fix is deleting rows directly in the
Supabase table editor.

## n8n automation — two options

**Option A — reuse what you already have.** Your existing n8n
"Publish To Website (GitHub)" node already commits files to GitHub via
the GitHub API — the same mechanism this site's `/api/create-post`
route uses under the hood. You can just repoint that node at
`content/posts/<slug>.mdx` and format the frontmatter to match the
shape above. No new endpoint needed.

**Option B — use the new `/api/create-post` route.** If you'd rather
n8n call a single URL instead of talking to GitHub directly:

```
POST https://your-site.vercel.app/api/create-post
Headers: x-api-token: <your CREATE_POST_TOKEN>
Body (JSON):
{
  "title": "...",
  "content": "...",
  "excerpt": "...",
  "image": "https://...",
  "category": "Premier League",
  "tags": ["optional"]
}
```

The route commits the `.mdx` file to your GitHub repo (it can't just
write to disk — Vercel's serverless filesystem doesn't persist between
requests), which then triggers the normal Vercel deploy.

## Contact page

`/contact` is a simple `mailto:` link to your business email — no
contact-form backend needed, so no extra cost or service to set up.

## Making the ads actually active

Right now every ad slot shows a dashed placeholder box, not a real ad —
that's expected until you have an approved AdSense account. To switch
them on:

1. Get approved on Google AdSense, create one ad unit per slot
   (header, feed, article).
2. In Vercel → Settings → Environment Variables, add:
   - `NEXT_PUBLIC_ADSENSE_CLIENT` — your publisher ID (`ca-pub-...`)
   - `NEXT_PUBLIC_ADSENSE_SLOT_HEADER`
   - `NEXT_PUBLIC_ADSENSE_SLOT_FEED`
   - `NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE`
3. Redeploy. Every placeholder box switches to a real ad automatically —
   no code changes needed.

## Adding your promo link

Open `components/PromoBox.tsx` and edit the three lines at the top:

```ts
const PROMO_TEXT = "Check out our recommended pick.";
const PROMO_LINK = "PUT YOUR LINK HERE";
const PROMO_BUTTON_LABEL = "Learn more";
```

`PROMO_LINK` can be anything at all — your own product, a different
store, any affiliate program. It shows automatically at the bottom of
every article — that's the only edit needed.

## Monetization

`components/AdSense.tsx` is wired into the homepage (header + mid-feed)
and every article (in-article slot) — swap in your real AdSense unit
code once your account is approved.

`components/AffiliateButton.tsx` exists but isn't used anywhere yet —
it's a generic button for whatever affiliate program you add later
(not betting-specific). Drop it into any page when you're ready.
