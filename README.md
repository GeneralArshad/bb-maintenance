# britishbiologicals.com — maintenance page

One page, one typeface, pure white. No framework, no dependencies — Node is the only requirement.

```
src/page.html      ← edit this. The only source file.
build.js           inlines the webfont, writes public/index.html
dev.js             local staging server (zero deps)
public/
  index.html       generated — do not edit
  assets/
    logo.png       ← you add
    facility.jpg   ← you add
fonts/             Instrument Sans woff2 (inlined at build)
vercel.json        build config + 503 routing
```

## Local staging

```bash
npm run dev          # http://localhost:4173, rebuilds when src/ changes
```

It serves `public/` and returns **503** for unknown paths — the same behaviour as production, so what you see locally is what ships. `npm run build` alone just regenerates `public/index.html`.

## The two images

Drop them in and reload — the page picks them up with no code change:

| File | Goes to | Notes |
|------|---------|-------|
| `public/assets/logo.png` | masthead | SVG is better if you have it — rename to `logo.svg` and change the `src` in `src/page.html`. The Figma export is 235×110, which will look soft on retina; export at 3× if PNG is all you have. |
| `public/assets/facility.jpg` | hero | Export at **2400px wide**, JPEG quality 80 (aim for 250–400 KB). The hero crops to 2.6:1 on desktop and 4:3 on mobile, centred — so keep the action away from the extreme left and right edges. |

Until they exist the page falls back gracefully: a typeset wordmark for the logo, a hatched placeholder for the hero.

## How the image gets hosted

It ships **inside the deployment**. Vercel serves `public/assets/facility.jpg` from its global CDN at `https://britishbiologicals.com/assets/facility.jpg`, and `vercel.json` already sets `Cache-Control: immutable, max-age=31536000` on everything under `/assets/`, so it's fetched once and cached for a year.

You do not need Cloudinary, S3, or Vercel Blob for this. Those earn their place when images are user-uploaded, or change without a redeploy, or need on-the-fly resizing — none of which is true for two fixed brand assets. When the Next.js site replaces this, `next/image` will handle resizing and AVIF/WebP conversion from the same static file.

To bust the cache after replacing an image, rename it (`facility-v2.jpg`) rather than relying on a purge.

## Deploy

```bash
npx vercel           # preview URL — hosted staging, share it before going live
npx vercel --prod    # production
```

Name the project `bb-maintenance`, separate from the eventual Next.js project, so the domain can be flipped between them later.

## Point the domain

Vercel project → **Settings → Domains** → add `britishbiologicals.com` and `www.britishbiologicals.com`. Then at your DNS host, delete the Webflow records and set:

| Type  | Name  | Value                  |
|-------|-------|------------------------|
| A     | `@`   | `76.76.21.21`          |
| CNAME | `www` | `cname.vercel-dns.com` |

Webflow's were `A @ → 75.2.70.75`, `A @ → 99.83.190.102`, `CNAME www → proxy-ssl.webflow.com`. Leave MX, TXT/SPF and DKIM alone — those carry your email.

Verify:

```bash
curl -sI https://britishbiologicals.com | head -20      # HTTP/2 503, retry-after: 604800
curl -sI https://britishbiologicals.com/assets/facility.jpg | head -20   # HTTP/2 200, immutable
```

The 503 is deliberate — it tells Google "temporarily unavailable, come back" and protects your rankings. A 200 would invite Google to index the maintenance copy as your homepage. Assets under `/assets/` are exempt and return 200.

## When the new site is ready

Remove the domain from `bb-maintenance`, add it to the Next.js project. Same Vercel account, so no DNS change.

## Design tokens

```
paper       #FFFFFF          ink        #0F1319
rule        #E7E9F0          ink-2      #3B4350
rule-soft   #EFF1F6          muted      #737B88
shade       #F5F6FA
accent      #2E3192   ← BB indigo, sampled from the Figma artboard. Replace with the exact
accent-ink  #262A7D      brand hex if you have it; both values are in :root in src/page.html.

Instrument Sans — 400 / 500 / 600, the only typeface.
Small caps labels: 11px / 500 / .13em tracking / uppercase (class .label).
```

Single-theme by intent: no dark-mode variants, pure white everywhere.
