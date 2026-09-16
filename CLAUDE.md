# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm install            # node_modules is not checked in and may be absent
npm run dev            # dev server
npm run build          # production build — needs Supabase reachable (see below)
npm run start          # serve the production build
npx tsc --noEmit       # the only check there is: no test suite, no ESLint config
npm run cf:preview     # build for Workers and run it locally in workerd
npm run cf:deploy      # build and deploy the Worker (never `wrangler deploy` — see below)
```

There are no tests and no linter. The `eslint-disable-next-line @next/next/no-img-element`
comments scattered through the components are inherited habit, not a configured rule.

`npm run build` needs a working Supabase connection and `NEXT_PUBLIC_SUPABASE_*` in
`.env.local`: `/` and every `/shop/[slug]` are prerendered from the database, and
`generateStaticParams` reads the product slugs. A missing key fails the build rather than
producing an empty shop — `unwrap()` in `src/lib/shop.ts` throws on Supabase errors on purpose.

Deploy with `opennextjs-cloudflare deploy`, not `wrangler deploy`: only the adapter's deploy
step seeds the prerendered pages into the KV cache.

## Architecture

Next.js 16 App Router + React 19 + Tailwind v4, deployed as a Cloudflare Worker via
`@opennextjs/cloudflare`. Supabase (Postgres) is the source of truth; a separate admin panel
repo writes to the same database and pokes this app to rebuild pages.

### The money invariant

**No total that the shop acts on is ever computed in the browser, and no price crosses the
wire from it.** This is the design constraint the checkout is built around; don't relax it.

- `src/components/CheckoutView.tsx` sends `/api/orders` only `{ slug, format, qty }` per line,
  plus customer, address and `shippingMethod`.
- `src/app/api/orders/route.ts` is deliberately thin — it shapes the request and calls the
  `place_order` RPC. It never sees a price and never adds anything up.
- `place_order` (in Postgres, not this repo) reprices every line from the product's own
  per-format price, checks stock, format availability and delivery eligibility, and returns
  `{ number, total, shipping }`. `anon` has no insert privilege on `orders` at all — only
  EXECUTE on that function.
- Errors with errcode `22023` are validation messages written for the shopper and are
  forwarded verbatim; anything else is logged and replaced with a generic message.

Totals rendered on screen are recomputed from the live catalogue (`priced` in `CheckoutView`),
never from the cart's stored `unitPrice` — a cart in localStorage can be carrying last week's
price, and the screen has to agree with what the database will charge.

### Where data comes from

- `src/lib/shop.ts` is the **only** place that reads Supabase. Every function maps rows into
  the shapes in `src/data.ts`, so the components never see database column names.
- `src/data.ts` holds the types and the pure helpers (`fromPrice`, `cityQualifies`,
  `canCheckout`). It is no longer a catalogue and no longer holds copy.
- `src/content/` holds copy with no admin screen: `site.ts` (nav, banner, hero stats, steps,
  promises), `displays.ts` (frame finishes) and `guides.ts` (the booklets). Editing these is a
  code change — deliberately, because they turn over far more slowly than the catalogue.
- `src/lib/product-view.ts` derives every string a card shows (`subline`, `cardTag`, `specs`,
  `isSellable`, `cheapestFormat`) from a catalogue row. The design came from a prototype whose
  products had one price and one image; nothing invents data, it all derives.
- `src/lib/supabase/database.types.ts` is generated from the database. The `.select()` argument
  must stay a **single string literal** — supabase-js parses it at the type level and a
  concatenation loses the row shape.
- `getPaymentDetails()` and `getDeliveryOptions()` are kept out of `getSettings()` because the
  root layout calls `getSettings()` on every page and has no business reading a bank account.

### Catalogue rules

Prices are PKR, and every format carries its own price (`price_boxed`, `price_built`,
`price_framed`) — nothing is derived from a base price and there is no uplift. Cards and sorts
use `fromPrice()`, the cheapest format actually on sale, so a build not sold boxed never
advertises a boxed price.

Two flags gate availability and the UI honours both: `formats` (any of the three can be off —
`ProductDetailView` falls back to the first available rather than trusting its state) and
`inStock` (badge, sold-out label, Add to cart disabled).

A build is only buyable when **both** hold, which is what `isSellable()` means. In stock with
every format switched off is a catalogue mistake, not a product: `place_order` rejects the line
anyway, so nothing offers an Add button or advertises a price for one — otherwise the mistake
surfaces as a dead end at checkout instead of a missing button.

### Delivery and payment

Standard courier is free and always offered. Hand delivery by TEAM HQ appears only when
**Settings → Delivery** in the admin lists towns; clearing them withdraws it. `cityQualifies()`
compares on letters alone ("islamabad.", "Islamabad", "Islamabad Capital Territory" all match)
and **mirrors `private.city_qualifies()` in the database** — if you change one, change both; the
database is what actually decides.

There is no payment gateway. The order is recorded as pending payment, and the confirmation page
shows the accounts plus a `wa.me` link prefilled with the order number. `canCheckout()` closes
the checkout entirely unless a WhatsApp number *and* at least one account are configured.

The placed order reaches `/checkout/confirmation` through `sessionStorage` under
`CONFIRMATION_KEY`, not the URL — an order reference in a shareable link invites enumeration.

### Rendering and revalidation

| Route | Mode | Why |
| --- | --- | --- |
| `/`, `/shop/[slug]`, `/booklets/[id]` | prerendered | static HTML, revalidated on demand |
| `/shop` | dynamic | awaits `searchParams` so `useSearchParams()` in `ShopView` resolves server-side and the grid ships as real HTML for any `?cat=` |
| `/best-sellers`, `/displays`, `/booklets` | prerendered | `/displays` reads no database at all |
| `/frames` | redirect | `redirect("/displays")`, so old links don't 404 |
| `/checkout`, `/checkout/confirmation` | `force-dynamic` | a stale copy could quote an old total or an old bank account |
| `/api/revalidate` | `force-dynamic` | — |

The admin calls `POST /api/revalidate` with `x-revalidate-secret`. It **fails closed**: a missing
`REVALIDATE_SECRET` returns 503 rather than leaving the endpoint open.

On Cloudflare that path needs all three overrides in `open-next.config.ts` — KV incremental
cache, D1 tag cache, Durable Object queue. Drop any one and the shop still serves but stops
updating. The D1 `revalidations` table is **not created by the adapter**, which also swallows the
error, so a missing table means the admin reports a successful save and nothing changes; see
`d1/tag-cache-schema.sql` and DEPLOYMENT.md §2.

KV, not R2, for the ISR cache — R2 needs a card on file. The trade is eventual consistency: a
revalidated page can take about a minute to reach every region.

### Conventions

- Unmatched URLs are caught by `src/app/[...notfound]/page.tsx`, which renders `Home` and returns
  200. `src/app/not-found.tsx` is a backstop and **must not import `Home`** — Next serialises the
  not-found boundary into every route's payload, so that shipped the whole homepage with every page.
- Plain `<img>` everywhere, not `next/image`, deliberately.
- Cart lives in `CartProvider` (`src/cart.tsx`), persisted to localStorage under `brikc.cart.v1`.
  It starts empty and fills in after mount — reading storage during render is a hydration mismatch.
  `money()` lives here too: rupees, no decimals.
- Fire independent Supabase reads with `Promise.all`, as the pages already do. Note the comment on
  `Promises` in `src/app/page.tsx`: a component named `Promise` would shadow the global.
- Commit subjects in this repo are plain sentences describing the behaviour change
  ("Pick province and city instead of typing them"), not Conventional Commits.

### Design system

Light and Material-leaning, ported from a Figma Make prototype (`../BrikcIt`, Vite, read-only
reference). Tailwind v4 with no config file; everything lives in `src/app/globals.css`.

- Colour comes from CSS variables — `--background`, `--surface`, `--surface-2`, `--foreground`,
  `--muted`, `--border`, `--primary` (`#e23a2e`), `--primary-2` (`#ff6b2c`). Reach for a token,
  not a hex. The exceptions are deliberate literals: the dark Best Sellers band (`#0b0b0d`,
  `#121114`) and the brand gradients.
- Depth is the three-step `--shadow-1/2/3` scale, not borders. `.mat-btn` goes on anything
  clickable for the press feedback.
- `.font-display` is Roboto Slab and needs an explicit `style={{ fontWeight: 700 | 800 }}`;
  body copy is Roboto.
- `src/components/ui.tsx` is the shared vocabulary: `Reveal`, `SectionHead`, `ExploreMore`,
  `AddButton`, `ProductCard`. Build pages from these rather than restyling one-offs.
- `.reveal` starts at **opacity 0** and only becomes visible when `<Reveal>` adds `.is-visible`,
  so anything using that class must be inside a `Reveal` or it never appears.
- Quick-add on a grid card confirms inline and does *not* open the cart drawer
  (`add(..., { open: false })`); the product page's deliberate add does open it.

### Copy must be true

The prototype this design came from was a mock, and its copy was mock copy — UK shipping
thresholds, "2,400+ sold", a companion app, a downloadable PDF, a newsletter and a search box
that went nowhere. None of it survived, and none of it should come back.

A claim on this site has to be sourced: from Supabase (lead times, Instagram handle, reviews,
FAQ), or from something the shop genuinely does (free courier anywhere in Pakistan, framed
builds in reinforced crates). If a control has no handler, delete the control rather than ship
it dead. `DISPLAY_FINISHES[].from` is `null` for exactly this reason — no one has supplied real
frame prices, so the cards omit the price line instead of showing a plausible number.

Admin-editable content must not be stranded by a redesign: the FAQ lives on `/booklets` and
reviews on the homepage, because the admin still has screens for both.

### Environment

`.env.local` (copy `.env.example`); in production these are split across two different places in
the Cloudflare dashboard — see DEPLOYMENT.md §5.

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — **build-time**; inlined by
  `next build` and needed for prerendering. Read-only under RLS; no secret key is used here.
- `REVALIDATE_SECRET` — runtime secret, must match the admin's exactly.
