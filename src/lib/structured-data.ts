import { FORMAT_LABELS, type Product, type Review } from "../data"
import { BUSINESS } from "../content/business"
import { largeImage } from "./media"
import { isSellable, soldFormats } from "./product-view"
import {
  ALTERNATE_NAMES,
  BRAND,
  SITE_URL,
  absoluteUrl,
  bundleDescription,
  displayDescription,
  instagramUrl,
  isLegoSet,
  modelDescription,
} from "./seo"

/**
 * The JSON-LD the pages print, as plain objects. src/components/JsonLd.tsx
 * turns one into a script tag.
 *
 * Every number here comes from the same row the page draws, through the same
 * helpers the cards use, so the structured data can never quote a price the
 * page doesn't. Where the page has nothing true to say — no price, no rating —
 * the field is left out rather than filled.
 *
 * A model's brand is LEGO, which is what lets Google match "lego pakistan" to
 * it; this is metadata, so the rule that keeps LEGO out of page copy allows it.
 * A model whose own description disclaims LEGO names no brand (isLegoSet() in
 * seo.ts): markup that contradicts the page is worse than none.
 * A display's brand is BrikcIt, because it is the shop's own product. A bundle
 * says neither: it can hold a display beside a set, and naming one brand for
 * the lot would call the display LEGO.
 */

type Json = Record<string, unknown>

const ORGANIZATION_ID = `${SITE_URL}/#organization`

/** Who sells everything, referred to by id from each offer. */
function seller(): Json {
  return { "@type": "Organization", "@id": ORGANIZATION_ID, name: BRAND, url: `${SITE_URL}/` }
}

/** The homepage's: the shop as an organisation, and the site's name for search results. */
export function siteJsonLd(instagram: string): Json[] {
  const profile = instagramUrl(instagram)
  const organization: Json = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: BRAND,
    alternateName: ALTERNATE_NAMES,
    url: `${SITE_URL}/`,
    logo: absoluteUrl("/brand/icon.png"),
    areaServed: { "@type": "Country", name: "Pakistan" },
  }
  if (profile) organization.sameAs = [profile]
  if (BUSINESS.email) organization.email = BUSINESS.email
  if (BUSINESS.phone) organization.telephone = BUSINESS.phone

  // Google takes the name it shows beside a result from WebSite, not from the
  // title tag, and falls back to alternateName when it won't use the first.
  const website: Json = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND,
    alternateName: ALTERNATE_NAMES,
    url: `${SITE_URL}/`,
    publisher: { "@id": ORGANIZATION_ID },
  }
  return [organization, website]
}

/** One thing the page sells at one price: an assembly, a size, a bundle. */
type Sold = { name?: string; price: number; inStock: boolean }

/**
 * An Offer per assembly or size, each at its own price. Not an AggregateOffer:
 * Google reads that for product snippets only, and a merchant listing wants a
 * concrete price. Prices are whole rupees; anything unpriced is left out.
 */
function offers(sold: Sold[], url: string): Json | Json[] | null {
  const list = sold
    .filter((s) => s.price > 0)
    .map((s) => ({
      "@type": "Offer",
      ...(s.name ? { name: s.name } : {}),
      price: s.price,
      priceCurrency: "PKR",
      availability: s.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      url,
      seller: seller(),
    }))
  if (list.length === 0) return null
  return list.length === 1 ? list[0] : list
}

/** The average of what is shown on the page, only when there is something to average. */
function aggregateRating(reviews: Review[]): Json | null {
  const rated = reviews.filter((r) => r.rating >= 1 && r.rating <= 5)
  if (rated.length === 0) return null
  const mean = rated.reduce((sum, r) => sum + r.rating, 0) / rated.length
  return {
    "@type": "AggregateRating",
    ratingValue: Math.round(mean * 10) / 10,
    reviewCount: rated.length,
    bestRating: 5,
    worstRating: 1,
  }
}

/**
 * A build's Product, for /shop/<slug> (a model or a bundle) or /displays/<slug>,
 * or null when there is nothing Google would accept it with.
 *
 * The offers are what the page would let you buy, each with the availability
 * the page's own Add button follows. A model is offered in the assemblies it is
 * sold in, frame left out because it is an extra, all off the one count; a
 * display in its sizes, each in stock only when the display and that size both
 * are, as DisplayDetailView decides; a bundle at its one price. A build with no
 * price at all — every assembly switched off, no sized variant, an unpriced
 * bundle — gets no offer, because any number would be invented.
 *
 * Google treats a Product with neither offers nor a rating as an error, and
 * every display arrives that way, so then there is no Product at all — the
 * breadcrumb still goes out on its own.
 */
export function productJsonLd(product: Product, path: string, reviews: Review[] = []): Json | null {
  const url = absoluteUrl(path)
  const data: Json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url,
  }

  const images = product.images.filter(Boolean).map((i) => largeImage(i))
  if (images.length > 0) data.image = images

  let offer: Json | Json[] | null
  if (product.kind === "model") {
    data.description = modelDescription(product)
    if (isLegoSet(product)) data.brand = { "@type": "Brand", name: "LEGO" }
    if (product.category) data.category = product.category
    offer = offers(
      soldFormats(product).map((f) => ({ name: FORMAT_LABELS[f], price: product.prices[f], inStock: product.inStock })),
      url,
    )
  } else if (product.kind === "display") {
    data.description = displayDescription(product)
    data.brand = { "@type": "Brand", name: BRAND }
    offer = offers(
      product.variants.map((v) => ({ name: v.label, price: v.price, inStock: product.inStock && v.inStock })),
      url,
    )
  } else {
    data.description = bundleDescription(product)
    offer = offers([{ price: product.bundlePrice, inStock: isSellable(product) }], url)
  }
  if (offer) data.offers = offer

  // Only reviews this page shows: the published ones of this build.
  const rating = aggregateRating(reviews)
  if (rating) data.aggregateRating = rating

  return offer || rating ? data : null
}

/** Home › Shop (or Displays) › the build. The last item is the page itself. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.name,
      item: absoluteUrl(step.path),
    })),
  }
}
