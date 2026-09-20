import { getDisplays, getGuides, getProductSlugs } from "./shop"

/**
 * Which pages a row change makes stale.
 *
 * This lives in the storefront, next to the routes, because the storefront is
 * the only thing that knows what each page reads. The admin kept its own copy
 * of this map and it drifted — a rename revalidated the dead URL, a stocktake
 * missed the display a variant rolls up into, marking an order paid moved stock
 * and rebuilt nothing. Every one of those was the same bug: a caller being
 * asked to remember a page it had no reason to know about.
 *
 * So the caller now says what changed, not what to rebuild, and this answers.
 */

export type Change = {
  table: string
  op?: "INSERT" | "UPDATE" | "DELETE"
  /** Which kind of product, for the tables that carry products. */
  kind?: "model" | "display" | null
  slug?: string | null
  /** The slug before a rename — its page has to go too, or the old URL lingers. */
  oldSlug?: string | null
}

const HOME = "/"
const BEST_SELLERS = "/best-sellers"
const DISPLAYS = "/displays"
const BOOKLETS = "/booklets"

// /shop is deliberately absent everywhere below. It awaits searchParams, so it
// renders per request and is never cached — asking to rebuild it is a no-op.

/** Every page that reads the catalogue or the settings. Used when that is the honest answer. */
async function everything(): Promise<string[]> {
  const [models, displays, guides] = await Promise.all([
    getProductSlugs(),
    getDisplays(),
    getGuides(),
  ])
  return [
    HOME,
    BEST_SELLERS,
    DISPLAYS,
    BOOKLETS,
    ...models.map((s) => `/shop/${s}`),
    ...displays.map((d) => `/displays/${d.slug}`),
    ...guides.map((g) => `/booklets/${g.slug}`),
  ]
}

function productPages(change: Change): string[] {
  const slugs = [change.slug, change.oldSlug].filter((s): s is string => !!s)
  return change.kind === "display"
    ? [HOME, DISPLAYS, ...slugs.map((s) => `/displays/${s}`)]
    : [HOME, BEST_SELLERS, ...slugs.map((s) => `/shop/${s}`)]
}

export async function pathsFor(change: Change): Promise<string[]> {
  switch (change.table) {
    // A variant is priced and counted on its own but has no page of its own —
    // it shows up on the display it belongs to, whose slug the caller resolved.
    case "products":
    case "product_variants":
      return productPages(change)

    // The chips on the homepage come from here, and so does the category name
    // on every build's page. A rename cascades to the builds carrying it, so
    // this is genuinely wider than the row that changed.
    case "categories":
      return [HOME, BEST_SELLERS, ...(await getProductSlugs()).map((s) => `/shop/${s}`)]

    // Lead times, the low-stock threshold every card reads, and the Instagram
    // handle in the footer of every page. There is no narrower answer.
    case "settings":
      return everything()

    case "faqs":
      return [BOOKLETS]

    // A chapter is the writing itself, and it only appears on the guide's page.
    case "guides":
    case "guide_chapters": {
      const slugs = [change.slug, change.oldSlug].filter((s): s is string => !!s)
      return [HOME, BOOKLETS, ...slugs.map((s) => `/booklets/${s}`)]
    }

    default:
      return []
  }
}
