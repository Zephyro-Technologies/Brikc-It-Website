-- Schema for the OpenNext D1 tag cache (binding NEXT_TAG_CACHE_D1).
--
-- The adapter reads and writes this table but never creates it, and it swallows
-- query errors — so if the table is missing, on-demand revalidation fails
-- silently: the admin reports a successful save and the shop never updates.
-- Run this once, before the first deploy.
--
--   npx wrangler d1 execute brikc-it-tags --remote --file=./d1/tag-cache-schema.sql
--
-- Derived from the adapter's own queries in
-- @opennextjs/cloudflare/dist/api/overrides/tag-cache/d1-next-tag-cache.js:
--   INSERT INTO revalidations (tag, revalidatedAt, stale, expire) VALUES (?, ?, ?, ?)
--   SELECT tag, revalidatedAt, stale, expire FROM revalidations WHERE tag IN (…)
-- The insert has no upsert clause, so the table is append-only and `tag` must
-- NOT be a primary key — reads take the newest entry per tag.

CREATE TABLE IF NOT EXISTS revalidations (
  tag           TEXT    NOT NULL,
  revalidatedAt INTEGER NOT NULL,
  stale         INTEGER,
  expire        INTEGER
);

-- Every read filters on tag.
CREATE INDEX IF NOT EXISTS idx_revalidations_tag ON revalidations (tag);
