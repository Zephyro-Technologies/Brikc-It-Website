# Deploying the storefront to Cloudflare Workers

Runs as a Worker via `@opennextjs/cloudflare`, built and deployed automatically
from GitHub. Target: **brikc.it**.

Do the storefront first — the admin needs its URL.

---

## 1. Resources it binds to — all provisioned

Nothing left to create. Every binding already exists on the account:

| Resource | Name / id | Purpose |
| --- | --- | --- |
| R2 bucket | `NEXT_INC_CACHE_R2_BUCKET` — `brikc-it-cache`, APAC | holds prerendered pages (ISR cache) |
| D1 database | `brikc-it-tags` — `3001ea28-a4bd-43fa-bb33-49c86236d887`, APAC primary | tag cache, what `revalidatePath()` writes to |
| Tag-cache table | `revalidations` | created, indexed, round-trip tested |
| Durable Object | `DOQueueHandler` | revalidation queue — created on first deploy by the `migrations` block |

### Why R2 and not KV

The cache was KV at first, because R2 can't be enabled without a payment method
on file. KV's free plan allows **1,000 writes a day**, and the cache ran through
them: every page regeneration is a write, every deploy seeds about 136 more, and
a page checked every few seconds regenerates about once a minute. Over the
limit, pages stopped updating, a deploy failed at the seeding step ("your
account has reached the free usage limit for this operation for today [code:
10048]"), and Cloudflare emailed the owner each time.

R2's free tier is counted by the month — 1,000,000 writes, 10,000,000 reads,
10 GB — and nothing is charged inside it. A card is on the account for that
reason only; set a billing notification if you want to hear about any charge.
R2 is also strongly consistent, so a revalidated page is current everywhere at
once. The old KV namespace (`6dc2397d2a74484297392bf2086284f0`) is no longer
bound and can be deleted.

The deploy creates the bucket if it is missing and seeds it through a temporary
worker, so the Workers Builds token needs R2 edit permission.

The Durable Object queue is also free: it uses the **SQLite** storage backend
(`new_sqlite_classes`), which is available on the Workers Free plan with no
charge for storage.

## 2. Tag-cache table — already done

Recorded here because it's the step whose absence is invisible: the adapter
reads and writes `revalidations` but never creates it, and swallows the error,
so a missing table means the admin reports a successful save and the shop
silently never updates.

It's created, indexed, and verified. To re-check at any point:

```bash
npx wrangler d1 execute brikc-it-tags --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
```

You should see `revalidations`. To rebuild it from scratch:

```bash
npx wrangler d1 execute brikc-it-tags --remote --file=./d1/tag-cache-schema.sql
```

## 2b. Let the database tell the storefront

The admin calls `/api/revalidate` after a save, but it only ever fires for writes
the admin itself makes — not a trigger moving stock when an order is marked paid,
not a variant rolling up into its parent, not a row edited in the SQL editor. So
Postgres announces its own writes too, through `pg_net`, to
`/api/revalidate/changed`.

The triggers ship in the admin's migrations. What does *not* ship is where to
send it, because one of the two values is the shared secret. Set both once, on
each database, in the Supabase SQL editor:

```sql
select vault.create_secret('https://brikc.it', 'storefront_url');
select vault.create_secret('<the storefront REVALIDATE_SECRET, exactly>', 'revalidate_secret');
```

`create_secret` **returns the new row's UUID, not a generated key.** It looks like
it handed you something to use and it did not — feeding that UUID back in as the
second secret is a natural mistake and produces a `401` on every announcement.
The second value is the storefront Worker's `REVALIDATE_SECRET`, which Cloudflare
will not show you, so if it is not written down, rotate rather than hunt: set a
new one in the storefront Worker, the admin Worker and here, all three the same.

Do not use that UUID as the secret either. `vault.secrets.id` is a plaintext
column — only `secret` is encrypted — so the shared secret would be sitting
unencrypted in the row next to it.

To change one later, update rather than create — the name is unique:

```sql
select vault.update_secret(
  (select id from vault.secrets where name = 'revalidate_secret'), '<new value>');
```

Leave both unset on a local stack and the triggers stay silent, which is what you
want when there is no storefront to call.

To check it is working — this is the one place that shows revalidation failing:

```sql
select status_code, content, created from net._http_response order by created desc limit 20;
```

`200` with a list of paths is a rebuilt page. `401` means the secret here and the
storefront's `REVALIDATE_SECRET` are not the same string.

## 3. GitHub — already done

The repo is `Zephyro-Technologies/Brikc-It-Website`, branch `master`, pushed and
in sync. `.env.local` is gitignored — secrets go in the dashboard, not the repo.

## 4. Create the Worker from the repo

Workers & Pages → **Create** → **Import a repository** → pick the repo.

| Setting | Value |
| --- | --- |
| Project name | `brikc-it` (must match `name` in `wrangler.jsonc`) |
| Build command | `npm run cf:build` |
| Deploy command | `npx opennextjs-cloudflare deploy` |
| Root directory | `/` |
| Production branch | `master` |

> If that form loops back on you the way the admin's did, it's because a Worker
> of that name already exists. Don't fight it — open the existing Worker and use
> **Settings → Build → Connect to Git** instead. Note also that Workers Builds
> only starts on a *new* push, so after connecting you may need one more commit
> to trigger the first build.

**Use `opennextjs-cloudflare deploy`, not `wrangler deploy`.** The adapter's
deploy step also uploads the prerendered pages into the R2 cache. Plain
`wrangler deploy` ships the worker without seeding that cache.

## 5. Environment variables

Two different places, and putting them in the wrong one is the classic failure.

**Build variables** — Settings → Build → Variables. `NEXT_PUBLIC_*` values are
baked into the JavaScript during `next build`, so they must exist *at build
time*. Set at runtime only, they end up `undefined` in the browser bundle.

```
NEXT_PUBLIC_SUPABASE_URL              https://aqszlkxxfcofieaoiuvu.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  sb_publishable_…
```

**Runtime secrets** — Settings → Variables and Secrets, as type *Secret*:

```
REVALIDATE_SECRET                     (the same value the admin uses)
BREVO_API_KEY                         (optional — every order email, §5b)
PUSHOVER_APP_TOKEN                    (optional — the owners' push, §5b)
PUSHOVER_GROUP_KEY                    (optional — the owners' push, §5b)
```

Generate one if you haven't:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## 5b. Order notifications — Brevo, Pushover and the domain

Every order — from the site or typed into the admin — emails the customer the
payment details and emails the owners a new-order alert. A delivered order asks
the customer for a review, and once more two days later if none came in. The
owners' push is built and paused. The database decides when each email goes
(CLAUDE.md, "An order sends its own emails"); this repo decides what it says.
Most of the work is outside this repo, and the order below matters: the domain
has to be able to send before the first real email goes out.

**1. Authenticate brikc.it in Brevo.** Create the account, then Senders,
Domains & Dedicated IPs → Domains → add `brikc.it`. Brevo can write its records
into Cloudflare for you; by hand it is three — a `brevo-code` TXT, the DKIM
record, and DMARC. No SPF is needed for Brevo. The code sends as
`orders@brikc.it` (`SENDER` in `src/lib/brevo.ts`), and Brevo
refuses a sender on a domain it hasn't verified.

**2. Turn off Brevo's IP blocking.** Settings → Security → Authorised IPs →
deactivate for API. A Worker calls out from a large, unpublished, changing pool
of addresses, and Brevo switches blocking on *by itself* once 30 days pass
without a new IP — after which the next order from an unseen address is refused.

**3. Fix DMARC, don't loosen it.** `_dmarc.brikc.it` was already
`p=quarantine`, with reports going to `onsecureserver.net` — GoDaddy's default,
read by nobody. Keep `p=quarantine`: this email carries bank account numbers,
which is exactly the email somebody would want to forge from this domain, and
brikc.it sends nothing else for it to catch. Point `rua` somewhere real —
Brevo suggests `mailto:rua@dmarc.brevo.com`. Brevo's DKIM signature is what
passes DMARC, so it must be verified before step 6.

**4. Give `orders@brikc.it` an inbox.** The domain has no MX record, so a reply
to the payment email bounces. Cloudflare → brikc.it → Email → Email Routing →
enable, then route `orders@brikc.it` to an owner's inbox. Cloudflare emails that
inbox a verification link, which has to be clicked before anything forwards.

**5. The API key.** Brevo → SMTP & API → API keys → create, and set it as
`BREVO_API_KEY`.

**6. Send one real test** to a Gmail inbox before trusting it: check it lands
in the inbox rather than spam, that the WhatsApp link isn't rewritten through a
tracking domain, and whether the free plan stamps "Sent with Brevo" on it —
Brevo's documentation doesn't say for transactional mail.

**7. Pushover.** Each owner installs the app and makes an account. The trial is
30 days; the licence is a one-time $4.99 per platform per person. **Buy it before
the trial ends** — a lapsed licence stops delivery and the API still reports
success, so nothing tells you. Then on pushover.net: create an application
(its token is `PUSHOVER_APP_TOKEN`) and a delivery group holding both owners'
user keys (its key is `PUSHOVER_GROUP_KEY`). Owners are added and removed in
that group, not in code.

**8. Who gets the new-order alert** is Vault's `order_alert_to`, which the
migration sets to Omer's address. Not this repo, which is public. To change it,
in the SQL editor:

```sql
update vault.secrets set secret = 'a@example.com,b@example.com' where name = 'order_alert_to';
```

**How it fails.** The order is committed before any of this runs and nothing
here can undo it, and nothing retries — so a failure is one missing email, never
two. `/api/emails` answers only after Brevo has, so its answer is the record:
`net._http_response` holds it, joined from `order_emails.request_id` (the query is
in CLAUDE.md). The owners' alert also says whether the payment email went —
"Payment email NOT sent — Brevo 401: Key not found". The shopper has the same
details on the confirmation page either way. Worker logs carry the same lines.

## 5c. Meta Pixel

Off until an id is set, and set in the admin rather than here: **Settings → Meta Pixel → Pixel ID**.
Save, and the settings trigger rebuilds every page with the script in it; clear the field to take it
out again.

The column is `settings.meta_pixel_id`, added by the admin's
`20260927120000_the_meta_pixel_is_a_setting.sql`. **Apply that migration before deploying the
storefront** — the root layout selects the column on every page, so a deploy that arrives first
fails everywhere.

To check it's firing: Events Manager → the pixel → Test events, with brikc.it open; or the Meta
Pixel Helper extension. A visit should show PageView, a build's page ViewContent, an add AddToCart,
`/checkout` InitiateCheckout, and a placed order AddPaymentInfo with the order number as its event id.

**Purchase comes from the database, when an order is marked paid** — the admin's
`20260927140000_a_paid_order_tells_meta.sql`. It is silent until the Conversions API token is in
Vault:

1. Events Manager → the dataset → **Settings → Conversions API** → generate an access token.
2. In the Supabase SQL editor: `select vault.create_secret('<the token>', 'meta_capi_token');` — it
   prints the new secret's uuid, which is not the token; don't paste that anywhere.
3. To try it without it counting: Events Manager → **Test events** → copy the test code, then
   `select vault.create_secret('<the code>', 'meta_test_event_code');`, mark an order paid, watch the
   Purchase arrive under Test events, and remove the code with
   `delete from vault.secrets where name = 'meta_test_event_code';`.
4. Meta's answers: `select status_code, content, created from net._http_response order by created desc limit 10;`
   — a 401 with code 190 is a wrong or revoked token.

Keep **Automatic events** and **Automatic website matching** off in the dataset's Settings; `/privacy`
doesn't describe what either would send.

## 6. Attach the domain

Worker → Settings → Domains & Routes → **Add custom domain** → `brikc.it`
(and `www.brikc.it` if you want it). The domain must already be on this
Cloudflare account; DNS records are created for you.

---

## Checks after the first deploy

```bash
# pages render from Supabase
curl -s https://brikc.it/ | grep -o 'Rs [0-9,]*' | head

# revalidation endpoint is locked down
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://brikc.it/api/revalidate \
  -H "content-type: application/json" -d '{"paths":["/"]}'      # expect 401
```

Then the real test: change a product price in the admin, save, and reload its
storefront page. It should show the new price within seconds. If it doesn't,
check step 2 first — a missing `revalidations` table is the usual cause.

## Notes

- `/` and `/shop/[slug]` are prerendered; `/shop` is dynamic because it reads
  `?cat=`. Only the prerendered pages need revalidating.
- Supabase is reached with the **publishable** key and row-level security allows
  it to read the catalogue only. No secret key is used here at all.
- `Logos/` holds the 6 MB brand source files. Harmless, but you can drop them
  from the repo if you'd rather keep it light — `public/brand/` has the derived
  assets the site actually serves.
