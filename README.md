# brikc.it — storefront

The brikc.it shop: LEGO-style cars, bikes, F1 and collector sets, sold built, boxed, or
mounted in LED-lit display frames. Next.js 16 App Router.

Originally ported from a Figma Make Vite prototype; that prototype is no longer the
reference — this app is the source of truth for the storefront.

Supabase is the source of truth. The admin panel (`../Brikc-It-Admin`) writes to the same
tables this app reads, and pokes `/api/revalidate` to rebuild the pages a save changed.

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
| `src/app/checkout/page.tsx` + `src/components/CheckoutView.tsx` | Checkout form |
| `src/app/checkout/confirmation/page.tsx` | Transfer details and the WhatsApp hand-off |
| `src/app/api/orders/route.ts` | Takes the order — hands straight to `place_order` in Postgres |
| `src/data.ts` | Catalogue types and the pure helpers — `fromPrice`, `priceOf`, `cityQualifies` |
| `src/cart.tsx` | Cart context and localStorage persistence (`money()` is in `src/lib/money.ts`) |
| `src/app/globals.css` | Brand tokens, fonts, LED glow, marquee/flicker keyframes |

## Catalogue rules

Prices are **PKR**. A build is an **assembly plus an optional frame**, and the two are
priced separately: `price_boxed` (unassembled) and `price_built` (assembled) for the
assembly, `price_frame_plain` and `price_frame_led` for the frame, each of them the frame
alone rather than a total. Nothing is derived — there is no base price and no uplift, and
a zero means that option isn't offered.

Cards and sorting use `fromPrice()`, the cheapest assembly actually on sale, so a build
that isn't sold unassembled never advertises an unassembled price. An assembly that is on
sale must have a price above zero; a check constraint on the table enforces that, not just
the form.

Two things gate availability, and the UI honours both:

- `formats` — either assembly can be switched off. The product page offers the ones that
  are on, falling back to the first available rather than trusting its own state.
- `stock` — a count, not a switch. Zero shows "Sold out" and disables Add to cart; at or
  under `settings.low_stock_at` a card says "Only 2 left". The count moves when an order
  is marked paid, not when it is placed.

## Checkout

There is no payment gateway. A shopper fills in their details, the order is
recorded as **pending payment**, and the confirmation page gives them the bank
and wallet accounts plus a WhatsApp button — prefilled with their order number —
to send the transfer receipt to. The admin marks the order paid once it lands.

Accounts and the WhatsApp number are edited in the admin under **Settings →
Payments**, not in code. Until both a WhatsApp number and at least one account
are filled in, `/checkout` politely refuses orders and points at Instagram
instead, so the shop can never take money it has nowhere to receive.

The total is never taken from the browser. `/api/orders` forwards only slug,
format and quantity to the `place_order` function in Postgres, which reprices
every line from the product's own per-format price, checks stock and
format availability, and returns the reference and total. `anon` has no insert
privilege on `orders` at all — only EXECUTE on that one function.

Two delivery options. Standard courier is free and always offered. Hand delivery
by TEAM HQ costs extra and only appears for shoppers whose city matches the towns
set in **Settings → Delivery** — clearing those towns withdraws it entirely.

Which option is legitimate, and what it costs, is decided by `place_order`, not
the browser: picking hand delivery for a city outside the covered towns is
rejected with a message naming the towns that are. Cities are compared on letters
alone, so "islamabad.", "Islamabad" and "Islamabad Capital Territory" all count.

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
