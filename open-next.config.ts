import { defineCloudflareConfig } from "@opennextjs/cloudflare"
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache"
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache"
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue"
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache"

/**
 * Cloudflare Workers needs all three pieces for the storefront to behave the way
 * it does locally:
 *
 *   incrementalCache  where prerendered pages live. Workers isolates are
 *                     short-lived and spread across the world, so the cache has
 *                     to be shared storage rather than process memory.
 *
 *   tagCache          what `revalidatePath()` actually talks to. Without it the
 *                     admin's "rebuild this page" call silently does nothing —
 *                     the App Router expresses path revalidation as a tag.
 *
 *   queue             runs the regeneration after a stale hit, out of band.
 *
 * Drop any of them and the shop still serves, but it stops updating when you
 * save in the admin.
 *
 * Why R2 and not KV: the free plan allows 1,000 KV writes a day, and the cache
 * ran through them — every regeneration is a write, a deploy seeds about 136
 * more, and a page checked every few seconds regenerates about once a minute. Over the limit, writes fail, pages stop updating and a deploy fails
 * at the seeding step (October 2026). R2's free tier is counted by the month —
 * a million writes, ten million reads — and is strongly consistent, so a
 * revalidated page is current everywhere at once. Enabling R2 needs a payment
 * method on file; nothing is charged inside the free tier. The regional cache
 * in front keeps repeat reads in the local data centre, off R2 entirely.
 */
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" }),
  tagCache: d1NextTagCache,
  queue: doQueue,
})
