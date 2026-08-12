# Deploying the storefront to Cloudflare Workers

Runs as a Worker via `@opennextjs/cloudflare`, built and deployed automatically
from GitHub. Target: **brikc.it**.

Do the storefront first — the admin needs its URL.

---

## 1. Resources it binds to

| Resource | Name | Status |
| --- | --- | --- |
| D1 database | `brikc-it-tags` | **done** — `3001ea28-a4bd-43fa-bb33-49c86236d887`, APAC primary, already in `wrangler.jsonc` |
| Tag-cache table | `revalidations` | **done** — created and round-trip tested |
| Durable Object queue | `DOQueueHandler` | nothing to do — created on first deploy by the `migrations` block |
| R2 bucket | `brikc-it-cache` | **you need to do this** — see below |

### R2 — the one outstanding item

R2 is not enabled on the account. The API refuses with
`Please enable R2 through the Cloudflare Dashboard [code: 10042]`, and that
switch can only be flipped in the dashboard.

1. Cloudflare dashboard → **R2** → enable it (Cloudflare asks for a card on
   file even though the free tier covers far more than this cache will use).
2. Create a bucket named exactly **`brikc-it-cache`**, or from this folder:

   ```bash
   npx wrangler r2 bucket create brikc-it-cache
   ```

**The deploy will fail until this bucket exists** — `wrangler` validates every
binding, and `NEXT_INC_CACHE_R2_BUCKET` points at it.

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
```

Generate one if you haven't:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

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
