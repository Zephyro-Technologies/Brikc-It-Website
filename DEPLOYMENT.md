# Deploying the storefront to Cloudflare Workers

Runs as a Worker via `@opennextjs/cloudflare`, built and deployed automatically
from GitHub. Target: **brikc.it**.

Do the storefront first — the admin needs its URL.

---

## 1. Create the two resources it binds to

In the Cloudflare dashboard:

| Resource | Where | Name |
| --- | --- | --- |
| R2 bucket | R2 → Create bucket | `brikc-it-cache` |
| D1 database | Storage & Databases → D1 → Create | `brikc-it-tags` |

Copy the D1 **database ID** and paste it into `wrangler.jsonc`, replacing
`REPLACE_WITH_D1_DATABASE_ID`. Commit that change — the build reads it.

> The Durable Object queue needs no setup. It's created on first deploy by the
> `migrations` block already in `wrangler.jsonc`.

## 2. Create the tag-cache table

**Skip this and on-demand revalidation fails silently** — saves in the admin
report success and the shop never changes. The adapter reads and writes this
table but doesn't create it, and swallows the error when it's missing.

```bash
npx wrangler d1 execute brikc-it-tags --remote --file=./d1/tag-cache-schema.sql
```

Verify:

```bash
npx wrangler d1 execute brikc-it-tags --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
```

You should see `revalidations`.

## 3. Push to GitHub

```bash
git add .
git commit -m "Storefront on Supabase, ready for Cloudflare"
git remote add origin git@github.com:<you>/brikc-it.git
git push -u origin main
```

`.env.local` is gitignored — secrets go in the dashboard, not the repo.

## 4. Create the Worker from the repo

Workers & Pages → **Create** → **Import a repository** → pick the repo.

| Setting | Value |
| --- | --- |
| Project name | `brikc-it` (must match `name` in `wrangler.jsonc`) |
| Build command | `npm run cf:build` |
| Deploy command | `npx opennextjs-cloudflare deploy` |

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
