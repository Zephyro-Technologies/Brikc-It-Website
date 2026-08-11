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
 *                     to be shared storage (R2) rather than process memory.
 *                     withRegionalCache puts a per-region read cache in front so
 *                     a hit doesn't cross the planet to reach the bucket.
 *
 *   tagCache          what `revalidatePath()` actually talks to. Without it the
 *                     admin's "rebuild this page" call silently does nothing —
 *                     the App Router expresses path revalidation as a tag.
 *
 *   queue             runs the regeneration after a stale hit, out of band.
 *
 * Drop any of them and the shop still serves, but it stops updating when you
 * save in the admin.
 */
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" }),
  tagCache: d1NextTagCache,
  queue: doQueue,
})
