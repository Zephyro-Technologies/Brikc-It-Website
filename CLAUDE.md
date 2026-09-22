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
- `src/content/` is what is left of copy with no admin screen: `site.ts` (nav and the
  how-it-works steps) and `displays.ts` (only the three promises under the `/displays` grid).
  The frame finishes, the booklet guides and the announcement bar used to live here and are
  now admin-managed — check the database before assuming a page's content is in the repo.
- **The announcement bar is `settings.banner`**, passed to `<Nav>` by the root layout.
  Empty means no bar at all, which is this table's idiom for off — the same way clearing the
  hand-delivery towns withdraws that option — so there is no second `banner_on` to disagree
  with the text. A CHECK caps it at 160 characters because it is one centred line in a thin
  strip, and the admin's counter mirrors that number.
- `src/lib/markdown.tsx` draws a product description. It is Markdown now — paragraphs, headings,
  bullet and numbered lists, bold, links and images, and nothing else. Written by hand rather than
  pulled in, because a library is a lot of code running over text from the admin. React escapes text
  nodes but **not** `href` and `src`, so every URL goes through `safeUrl()`, which allows only http,
  https, mailto and real paths — `//host/x` is not a path, it is protocol-relative, and is refused.
- A product may carry up to two videos. A pasted link is never stored as a link: only the provider and
  the video's id are kept, and `embedUrl()` builds the player address from those, so nothing anybody
  types can reach an iframe. The database checks the same shapes, because a form check protects
  nobody who writes to the table another way.
- **A customer can write a review, and that is the shop's only public write besides an order.**
  It is built exactly like the checkout: `anon` has no INSERT on `reviews`, only EXECUTE on
  `submit_review()`. Four things hold the abuse surface shut and none of them is in the browser:
  the order number must match the email on that order (one message for both being wrong, so the
  form is not an oracle for which order numbers exist); the order must actually have contained
  the build; a unique index on `(order_id, product_id)` allows one review per build per order;
  and nothing is visible until somebody publishes it — `anon` is granted only `status =
  'published'` rows, **and only the columns a card is made of**, because RLS picks rows and a
  column grant is the only thing that can keep `submitter_email` and `upload_token` off the API.
- **Media rides on a token, not a login.** `submit_review()` returns an `upload_token`; the
  browser puts files in `review-images/<token>/…` or `review-videos/<token>/…`. The storage
  policy calls `private.review_upload_open()`, which says yes only while that review is still
  pending, was submitted within the hour, and holds fewer than three photos or fewer than one
  video. `attach_review_media()` then ties a file to the review, and refuses a path outside the
  token or an object that is not actually in the bucket. This is `anon`'s only write anywhere in
  storage. `src/lib/supabase/upload.ts` is the one place the *browser* talks to Supabase —
  everywhere else `src/lib/shop.ts` reads it on the server — because a 50 MB video should not go
  through the Worker twice.
- **`featured` is what the homepage shows**, and it is separate from `published` on purpose: a
  review can be on the site's record without being one of the ones on the front page. Both gate
  independently.
- A **review** carries a `rating` (1–5, CHECK-enforced) and an optional `product_id`. The card's
  photograph is that build's first image — never an avatar, because what belongs beside "it
  arrived immaculate" is the thing that arrived. `product_id` is ON DELETE SET NULL and `build`
  stays as free text beside it, so a review outlives the build it is about: the embed comes back
  null, the caption still names what it was, and the card lays out without a photograph rather
  than showing a hole. Reviews render on `/` only, which is what `pathsFor()` says and what the
  `reviews_announce` triggers rebuild.
- `src/lib/product-view.ts` derives every string a card shows (`subline`, `cardTag`, `specs`,
  `isSellable`, `cheapestFormat`, `cheapestVariant`, `displayVisual`) from a catalogue row, and
  branches on the product's kind. The design came from a prototype whose products had one price
  and one image; nothing invents data, it all derives.
- `src/lib/supabase/database.types.ts` is generated from the database. The `.select()` argument
  must stay a **single string literal** — supabase-js parses it at the type level and a
  concatenation loses the row shape.
- `getPaymentDetails()` and `getDeliveryOptions()` are kept out of `getSettings()` because the
  root layout calls `getSettings()` on every page and has no business reading a bank account.

### Catalogue rules

**A product has a kind, and the two are priced differently.** A `model` is a scale build priced
by format; a `display` is a frame or desk priced by `product_variants`, one row per size or
finish. `place_order` branches on the kind and refuses a line that sends the wrong one — a cart
calling a desk "boxed" is a bug worth surfacing, not smoothing over.

Models live at `/shop` and `/shop/<slug>`; displays live at `/displays` and `/displays/<slug>`
and never appear in the shop grid or its category chips. `getProducts()` returns models only,
`getDisplays()` returns displays with their variants.

A display shows its photograph when it has one and its `swatch` — a CSS colour or gradient —
when it doesn't, so a finish nobody has shot yet still reads as a material. A display with no
priced variants renders and says it cannot be ordered, which is how every one of them arrives.

**A frame is lit or unlit.** `price_frame_plain` and `price_frame_led` are the two prices, each the
frame alone; a zero means that kind isn't offered, and `sells_framed` still means "a frame can be
added at all". The shopper picks one of three — none, plain, led — and `order_lines.frame_led` records
which, beside `with_frame`. `price_frame`, the single price that came before, is kept in step by the
admin for the storefront still deployed during a changeover and read by `place_order` when a request
arrives in the old `{"framed": true}` shape: that page could only ever have quoted `price_frame`, so
that is what such a line is charged. Anything claiming a frame is LED has to check which kinds are
actually priced — `frameChoices()` — or it will contradict the chooser on the same page.

**A build is an assembly plus an optional frame.** A shopper chooses unassembled or assembled —
stored as `boxed` and `built`, which already meant that; only the labels changed, because renaming
them would rewrite what past orders say they sold — and separately ticks an LED frame, priced on its
own in `price_frame` and added on top. Four combinations from three numbers, and an unassembled kit
can be bought with a frame to put it in later, which the old three-way pick made impossible.

`FORMAT_KEYS` is therefore two long, and typed `SoldFormat[]` — `Exclude<FormatKey, "framed">`.
`"framed"` survives in `FormatKey` only so order lines written before the change can still name what
they sold, which is why `OrderLine.format` keeps it while `Product["prices"]` and the manual-order
draft do not: history has to be able to say "framed", nothing being written now does. `place_order`
refuses it for new lines and tells the shopper to re-add the item, and `priceOf()` returns 0 for it
rather than indexing a price that no longer exists. `order_lines.with_frame` records whether a frame
went with a line.

`products.price_framed`, the old framed TOTAL, is **gone** —
`20260921120000_drop_the_dead_framed_price.sql`. It was left in place by
`20260920120000_frame_as_an_addon.sql` so the deployed shop kept quoting correctly across the
changeover, then sat at 0 on every row written afterwards. Dropping it was expand/contract: both
apps stopped selecting it and shipped first, because `unwrap()` throws on a Supabase error on
purpose, so a select naming a column that is gone is a 500 rather than an empty shop.

Prices are PKR, and each assembly carries its own price — nothing is derived from a base price and
there is no uplift on the assemblies. Cards and sorts use `fromPrice()`, the cheapest assembly
actually on sale, so a build not sold unassembled never advertises an unassembled price.

**A category is not a price bracket.** `PRICE_BANDS` in `src/data.ts` is three fixed brackets in
code — under Rs 10,000, Rs 10,000–25,000, over Rs 25,000 — filtered on `/shop` through `?price=`,
which composes with `?cat=`. They are deliberately not rows: a build is in a bracket because of what
it costs, so nobody files it there and nobody re-files it when the price changes. Both bounds are
inclusive and prices are whole rupees, so the three tile the range exactly — Rs 10,000 reads
"Rs 10,000 – 25,000", never "Under Rs 10,000". `inPriceBand()` excludes anything the card would show
as "Not available", so what you filter by is always the number you then read; it mirrors
`isSellable()` and the two change together. The chips on `/shop` stay a taxonomy and price stays a
dropdown on purpose — giving them the same shape is what makes someone file "Under 10k" as a
category.

**Categories are rows, not an enum — and a build sits in as many as it likes.**
`product_categories` is the junction and the truth: one row per membership, `category` a foreign
key onto `categories(name)` with `ON UPDATE CASCADE ON DELETE RESTRICT` — so renaming a category
moves every build carrying it in the same statement, and deleting one that still holds builds is
refused rather than orphaning them.

`products.category` is still there and still true: a trigger keeps it as the **first** of a
build's categories, ordered the way the chips are, so anything that can only name one — a card, a
breadcrumb — names the one the shop would file it under first. It is also what
`products_category_matches_kind` checks, which is why taking a model's last category away is
refused with a message rather than a constraint error: a build under no chip is not a catalogue
state anybody wants. A display sits in none and keeps NULL.

`ShopView` filters on **membership**, not equality — a build in three categories answers to all
three chips. `categories.slug` is what `?cat=` carries and what `ShopView` filters
on, so a rename never breaks a shared link. Nothing is hardcoded: the chips on `/shop` and in the
hero are whatever `getCategories()` returns, and a shop with no categories shows no chips.
A display's category is **null** — it belongs to no shopper-facing category, and a CHECK enforces
`(kind = 'model') = (category is not null)`.

**Stock is a count, not a switch.** `products.stock` and `product_variants.stock` are integers;
`in_stock` still exists on both but is **GENERATED** as `stock > 0`, so writing it is an error
and the two can never disagree. One count per build: a model's three formats all come off the
same kit and share it, while a display is counted per variant and `products.stock` is the sum,
maintained by a trigger on `product_variants`. Stock can go negative — that is "oversold", and
it is shown rather than clamped.

The count moves when an order is marked **paid**, not when it is placed (a trigger on `orders`;
`private.stock_is_committed()` names the statuses that hold stock, and moving back out of one
returns it). Orders arrive `pending_payment` and settle by bank transfer, so holding stock at
checkout would let an abandoned cart sit on the last unit. The accepted trade is that two
shoppers can order the last one before either pays. `place_order` reads the count and never
writes it, but does refuse a line for more than is on the shelf.

`settings.low_stock_at` is the threshold at which a card starts saying "Only 2 left"; zero turns
it off. The root layout publishes it through `ShopSettingsProvider` so cards on all five pages
read it without every page threading a prop.

Two things gate availability and the UI honours both: `formats` (any of the three can be off —
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
| `/`, `/shop/[slug]`, `/booklets/[id]` | prerendered, `revalidate = 60` | static HTML, rebuilt on demand — and at worst a minute behind anyway |
| `/shop` | dynamic | awaits `searchParams` so `useSearchParams()` in `ShopView` resolves server-side and the grid ships as real HTML for any `?cat=`; also why a category change needs no revalidation here |
| `/best-sellers`, `/displays`, `/displays/[slug]`, `/booklets` | prerendered, `revalidate = 60` | all read the database; a content or catalogue save rebuilds them |
| `/frames` | redirect | `redirect("/displays")`, so old links don't 404 |
| `/checkout`, `/checkout/confirmation` | `force-dynamic` | a stale copy could quote an old total or an old bank account |
| `/api/revalidate`, `/api/revalidate/changed` | `force-dynamic` | — |

**Every prerendered page carries `revalidate = 60`, and that is a floor, not the mechanism.** A
save still rebuilds a page in about a second through the endpoints below; the floor exists because
without one those calls were the *only* thing that could ever change a page. One wrong
`REVALIDATE_SECRET` and the shop served deploy-time prices indefinitely — and kept taking orders,
because `/checkout` is dynamic and quoted the real ones, so the page and the till disagreed. Sixty
seconds is the smallest useful value: KV takes about that long to reach every region anyway.

**Two endpoints, and they are not interchangeable.**

- `POST /api/revalidate` takes `{ paths }` and rebuilds exactly those. The right shape for a caller
  that knows the site — the admin, or a person with curl. It caps one request at `MAX_PATHS` (50)
  and drops the rest **without saying so**, so the admin batches anything longer;
  `STOREFRONT_PATH_LIMIT` there mirrors this number and the two move together.
- `POST /api/revalidate/changed` takes `{ table, op, kind, slug, oldSlug }` — *what changed*, not
  what to rebuild — and works the pages out itself in `src/lib/revalidate-paths.ts`. This is what
  Postgres calls.

Both **fail closed**: a missing `REVALIDATE_SECRET` returns 503 rather than leaving them open.

**The database announces its own writes.** Triggers on `products`, `product_variants`, `categories`,
`settings`, `faqs`, `guides` and `guide_chapters` call `/api/revalidate/changed` through `pg_net`
(`20260920190000_the_database_tells_the_storefront.sql` in the admin repo). That closes the hole the
admin could never close: it only ever fired for writes *it* made, so marking an order paid, a
variant rolling up into its parent, a category rename cascading, or anyone editing a row in the SQL
editor all changed the shop and rebuilt nothing. The admin keeps its own call — it is synchronous
and lands immediately, which is what an operator expects after pressing save. This is the net under
it, and the floor above is the net under that.

The route map is therefore the storefront's, not the caller's — which is the point. Anything whose
real effect is wider than the row it wrote still has to reach the wider set, but that judgement now
lives in one file next to the routes instead of in whichever caller happened to write the row: a
display's page is `/displays/<slug>` and never `/shop/<slug>`; a rename rebuilds both slugs; a
settings change sweeps everything. Paths come from the **live** `products.slug`, never from
`order_lines.slug`, which is a snapshot of what was sold and names a dead URL after a rename.

Whether any of it is working is one query, on the database:

```sql
select status_code, content, created from net._http_response order by created desc limit 20;
```

A 401 there means the secret does not match the storefront's. Vault holds `storefront_url` and
`revalidate_secret`; unset, the triggers stay silent, which is what a local stack wants.

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
- Cart lives in `CartProvider` (`src/cart.tsx`), persisted to localStorage under `brikc.cart.v2`.
  A line carries either a `format` (model) or a `variantId` (display); the key was
  bumped because a cart saved under the old shape would crash the drawer.
  It starts empty and fills in after mount — reading storage during render is a hydration mismatch.
  `money()` is NOT here — it lives in `src/lib/money.ts`, because this file is a client
  component and Server Components format prices too.
- Fire independent Supabase reads with `Promise.all`, as the pages already do. Note the comment on
  `Promises` in `src/app/page.tsx`: a component named `Promise` would shadow the global.
- Commit subjects in this repo are plain sentences describing the behaviour change
  ("Pick province and city instead of typing them"), not Conventional Commits.

### Design system

Light and Material-leaning, ported from a Figma Make prototype (`../BrikcIt`, Vite, read-only
reference). Tailwind v4 with no config file; everything lives in `src/app/globals.css`.

- Colour comes from CSS variables — `--background`, `--surface`, `--surface-2`, `--foreground`,
  `--muted`, `--border`, `--primary` (`#d31f2e`), `--primary-2` (`#f0384a`) and `--primary-deep`
  (`#b81022`). All three sit at the logo's hue, ~354°. White text clears AA on
  `--primary` and `--primary-deep` but not on `--primary-2`, so a gradient with text
  on it runs between the first two and `--primary-2` stays decorative. Reach for a
  token, not a hex. The exceptions are deliberate literals: the page's chrome (`#0b0b0d`) and
  the brand gradients. The header, the footer and the Best Sellers band are all that one black,
  so the page opens and closes on the same colour; `#121114` is the band's second stop.
- The chrome being dark is what makes the lockup legible: its wordmark is a pale metal, and on
  the light header it measured 2.03:1. The Cart button is `--primary`, the only red control in
  the header, and its count badge inverts to white because red on red is not a badge.
- Depth is the three-step `--shadow-1/2/3` scale, not borders. `.mat-btn` goes on anything
  clickable for the press feedback.
- `.font-display` is Roboto Slab and needs an explicit `style={{ fontWeight: 700 | 800 }}`;
  body copy is Roboto.
- `src/components/ui.tsx` is the shared vocabulary: `Reveal`, `SectionHead`, `ExploreMore`,
  `AddButton`, `ProductCard`, `ComingSoon` (what a section shows when it is empty). Build pages from these rather than restyling one-offs.
- `.reveal` starts at **opacity 0** and only becomes visible when `<Reveal>` adds `.is-visible`,
  so anything using that class must be inside a `Reveal` or it never appears.
- Quick-add on a grid card confirms inline and does *not* open the cart drawer
  (`add(..., { open: false })`); the product page's deliberate add does open it.
- **The brand assets are generated, not hand-edited.** `Logos/` holds the two lockups as
  supplied; `scripts/brand-assets.py` cuts `public/brand/logo.webp` (horizontal, the header),
  `logo-stacked.webp` (vertical, the footer) and `icon.png` from them. One file per lockup, not a
  light/dark pair — both are drawn in metal on nothing. Re-run it when the logos change; read its
  docstring first, because the horizontal lockup is a brick in a display frame and keying the
  white out from the corners cannot reach the inside of that frame or the bowl of the "b". Left
  opaque they are invisible on a white page and a lit slab on a dark one, which is how the header
  shipped with a white box in it.

### Copy must be true

The prototype this design came from was a mock, and its copy was mock copy — UK shipping
thresholds, "2,400+ sold", a companion app, a downloadable PDF, a newsletter and a search box
that went nowhere. None of it survived, and none of it should come back.

A claim on this site has to be sourced: from Supabase (lead times, Instagram handle, reviews,
FAQ), or from something the shop genuinely does (free courier anywhere in Pakistan, framed
builds in reinforced crates). If a control has no handler, delete the control rather than ship
it dead. There is no seed file, deliberately: one existed with an invented catalogue in it, and
although it only ran locally it kept surfacing as real products on a shop that has none.
A reset gives the schema, the settings singleton and the category rows — nothing else.

Admin-editable content must not be stranded by a redesign — the FAQ lives on `/booklets`
for that reason, and **reviews** are back on the homepage under "Built to be shown off" after a
spell with an admin screen and nowhere to render. One thing is still stranded and wants a
decision: a **category's blurb and cover image** are editable but the storefront only renders the
category name.

### Environment

`.env.local` (copy `.env.example`); in production these are split across two different places in
the Cloudflare dashboard — see DEPLOYMENT.md §5.

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — **build-time**; inlined by
  `next build` and needed for prerendering. Read-only under RLS; no secret key is used here.
- `REVALIDATE_SECRET` — runtime secret, must match the admin's exactly.

### Running the whole thing locally

The schema and the migrations live in the admin repo (`../Brikc-It-Admin`) — this
app only ever reads. To bring up a local backend:

```bash
cd "../Brikc-It-Admin" && supabase start   # applies every migration
supabase status                            # prints the URL and publishable key for .env.local
```

The local stack is on **544xx, not the Supabase default 543xx** — another project on this machine
holds that range, and `supabase/config.toml` there was remapped so both can run at once. API
`54421`, Postgres `54422`, Studio `54423`.

Both apps read the same stack with the same publishable key, and both want port 3000, so run the
admin on another: `npm run dev -- -p 3001`. Their `REVALIDATE_SECRET` values must be identical or
every revalidation 401s.

The admin needs a Supabase Auth user that is also enrolled in `public.admins` — RLS gates on that
table, so an account that isn't enrolled signs in and legitimately sees nothing. `admins` has only
a SELECT policy, so the first one is created with SQL; DEPLOYMENT.md in the admin has the snippet.

Two things that bite:

- `psql` may not be on PATH. Go through the container:
  `docker exec supabase_db_BrickIt_Admin psql -U postgres -d postgres -c '…'`
- Checkout is closed until **Settings → Payments** has a WhatsApp number and at least one account.
  `canCheckout()` is doing its job — nothing invents a bank account, so a fresh database shows
  "ordering online is off right now" until someone fills them in.
