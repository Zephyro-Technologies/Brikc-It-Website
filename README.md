# brikc.it — storefront

The brikc.it shop: LEGO-style cars, bikes, F1 and collector sets, sold built, boxed, or
mounted in LED-lit display frames. Next.js 16 App Router.

Originally ported from a Figma Make Vite prototype; that prototype is no longer the
reference — this app is the source of truth for the storefront.

The catalogue is kept in lockstep with the admin panel (`../BrickIt Admin`): same
products, prices, format availability and stock flags. In phase 2 both read from one set
of Supabase tables instead of their local data files.

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build
npm run start   # serve the production build
```

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- Tailwind CSS v4 via `@tailwindcss/postcss`
- lucide-react icons

## Structure

| Path | What it is |
| --- | --- |
| `src/app/layout.tsx` | Shell — nav, cart drawer, footer, scroll-to-top |
| `src/app/page.tsx` | Home (hero, formats, categories, featured, reviews, CTA) |
| `src/app/shop/page.tsx` + `src/components/ShopView.tsx` | Catalogue with category filter and sort |
| `src/app/shop/[slug]/page.tsx` + `src/components/ProductDetailView.tsx` | Product page |
| `src/app/[...notfound]/page.tsx`, `src/app/not-found.tsx` | Unknown URLs fall back to home |
| `src/data.ts` | The catalogue |
| `src/cart.tsx` | Cart context and `money()` |
| `src/app/globals.css` | Brand tokens, fonts, LED glow, marquee/flicker keyframes |

## Catalogue rules

Prices are **PKR**. A product's `price` is what a **boxed** set costs; built and framed
add a fixed amount from `FORMAT_UPLIFT`:

```
boxed  = price
built  = price + 25,000
framed = price + 68,000
```

Two per-product flags control availability, and the UI honours both:

- `formats` — a build can have any of the three switched off. The product page only
  offers the enabled ones (Podium Trio is built or framed only, never boxed).
- `inStock` — false shows a "Sold out" badge on the card, a sold-out label on the
  product page, and disables Add to cart.

## Rendering

- `/` and `/shop/[slug]` are prerendered as static HTML at build time (all 8
  products), so the build needs a working Supabase connection.
- `/shop` is server-rendered so the grid ships as real HTML for any `?cat=`
  value; filtering and sorting after that stay client-side and instant.
- Saving in the admin calls `POST /api/revalidate`, which rebuilds just the pages
  that changed. On Cloudflare that needs a KV namespace, a D1 tag cache and a
  Durable Object queue — all provisioned; see [DEPLOYMENT.md](DEPLOYMENT.md).
- Images use plain `<img>` tags rather than `next/image`, which keeps layout and
  loading behaviour simple and predictable.

## Deploying

Cloudflare Workers via `@opennextjs/cloudflare`, built from GitHub.
**See [DEPLOYMENT.md](DEPLOYMENT.md)** — note especially the D1 table in step 2,
without which on-demand revalidation fails silently.

```bash
npm run cf:build     # build the worker bundle
npm run cf:preview   # run it locally in workerd
```
