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
| `src/app/checkout/page.tsx` + `src/components/CheckoutView.tsx` | Checkout form |
| `src/app/checkout/confirmation/page.tsx` | Transfer details and the WhatsApp hand-off |
| `src/app/api/orders/route.ts` | Takes the order — hands straight to `place_order` in Postgres |
| `src/data.ts` | The catalogue |
| `src/cart.tsx` | Cart context, `money()`, localStorage persistence |
| `src/app/globals.css` | Brand tokens, fonts, LED glow, marquee/flicker keyframes |

## Catalogue rules

Prices are **PKR**. Each build carries its own price for each of the three formats —
`price_boxed`, `price_built`, `price_framed` — all typed in the admin. Nothing is
derived: a framed F1 car and a framed collector trio cost what they cost.

Cards and sorting use `fromPrice()`, the cheapest format actually on sale, so a build
that isn't sold boxed never advertises a boxed price. A format that is on sale must
have a price above zero; a check constraint on the table enforces that, not just the
form.

Two per-product flags control availability, and the UI honours both:

- `formats` — a build can have any of the three switched off. The product page only
  offers the enabled ones (Podium Trio is built or framed only, never boxed).
- `inStock` — false shows a "Sold out" badge on the card, a sold-out label on the
  product page, and disables Add to cart.

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

Delivery is free nationwide, so the total is the subtotal. That is one line in
the migration if it ever changes.

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
