import type { MetadataRoute } from "next"
import { getGuides, getSitemapProducts } from "../lib/shop"
import { largeImage } from "../lib/media"
import { absoluteUrl } from "../lib/seo"

/**
 * /sitemap.xml: every page a search engine should know about, and nothing it
 * shouldn't — not /checkout, not /api, not /frames, which only redirects.
 *
 * A floor under the cache like every catalogue page (see src/app/page.tsx),
 * and rebuilt sooner when a build or a booklet changes, through
 * src/lib/revalidate-paths.ts.
 */
export const revalidate = 3600

/** The written pages, which read only settings. */
const WRITTEN = ["/contact", "/how-it-works", "/shipping-policy", "/refund-policy", "/terms", "/privacy"]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, guides] = await Promise.all([getSitemapProducts(), getGuides()])

  // A model and a bundle live in the shop; a display has its own page and
  // never appears under /shop.
  const builds = products.map((p) => ({
    url: absoluteUrl(p.kind === "display" ? `/displays/${p.slug}` : `/shop/${p.slug}`),
    lastModified: new Date(p.updatedAt),
    images: p.image ? [largeImage(p.image)] : undefined,
  }))

  // When the catalogue last changed is the honest answer for the pages that
  // list it. The others carry no date rather than an invented one.
  const latest = products.length
    ? new Date(Math.max(...products.map((p) => Date.parse(p.updatedAt))))
    : undefined
  // /displays stays out while there are none, as it does in the nav: a page
  // that only says "coming soon" is nothing worth indexing.
  const hasDisplays = products.some((p) => p.kind === "display")

  return [
    { url: absoluteUrl("/"), lastModified: latest },
    { url: absoluteUrl("/shop"), lastModified: latest },
    { url: absoluteUrl("/best-sellers"), lastModified: latest },
    ...(hasDisplays ? [{ url: absoluteUrl("/displays"), lastModified: latest }] : []),
    { url: absoluteUrl("/guides"), lastModified: latest },
    { url: absoluteUrl("/booklets") },
    ...builds,
    ...guides.map((g) => ({ url: absoluteUrl(`/booklets/${g.slug}`) })),
    ...WRITTEN.map((path) => ({ url: absoluteUrl(path) })),
  ]
}
