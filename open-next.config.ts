import { defineCloudflareConfig } from "@opennextjs/cloudflare"
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache"
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
 * Why KV and not R2: R2 cannot be enabled without a card on file, and this
 * project deliberately stays on the free tier. The trade is that KV is
 * eventually consistent — a revalidated page can take up to about a minute to
 * appear in every region, instead of being immediate. For a catalogue that
 * changes a few times a day that is a fair price; the regional cache in front
 * keeps repeat reads local either way. Switching back to R2 later is a two-line
 * change here plus a bucket binding.
 */
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(kvIncrementalCache, { mode: "long-lived" }),
  tagCache: d1NextTagCache,
  queue: doQueue,
})
