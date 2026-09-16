import { FORMAT_KEYS, FORMAT_LABELS, fromPrice, type FormatKey, type Product } from "../data"

/**
 * Presentation helpers that turn a catalogue row into the strings the cards and
 * the product page show.
 *
 * The design came from a prototype whose products had a single price, one
 * image and a hand-written "sub" line. Real builds have three per-format
 * prices, a stock flag and per-format availability, so everything the design
 * asks for is derived here rather than invented — one place to look when a
 * label reads wrong.
 */

/** The formats this build is actually sold in, in display order. */
export function soldFormats(product: Product): FormatKey[] {
  return FORMAT_KEYS.filter((f) => product.formats[f])
}

/**
 * Whether a shopper can actually buy this build right now.
 *
 * Stock is only half of it: a build with every format switched off is in stock
 * and unbuyable. `place_order` rejects such a line anyway, but a card that
 * offers an Add button for it turns a catalogue mistake into a shopper's dead
 * end at checkout, so nothing offers it in the first place.
 */
export function isSellable(product: Product): boolean {
  return product.inStock && soldFormats(product).length > 0
}

/**
 * The format a "from" price refers to — the cheapest one on sale. Quick-add on
 * a card uses this, so the price shown and the price added always agree.
 *
 * Callers must gate on isSellable() first; the "boxed" fallback here exists
 * only so the type stays total, and adding it would be rejected server-side.
 */
export function cheapestFormat(product: Product): FormatKey {
  const sold = soldFormats(product)
  if (sold.length === 0) return "boxed"
  return sold.reduce((best, f) => (product.prices[f] < product.prices[best] ? f : best), sold[0])
}

/** "Boxed · Built · Framed + LED" — the ways this build can be had. */
export function formatSummary(product: Product): string {
  const sold = soldFormats(product)
  if (sold.length === 0) return "Not currently sold"
  return sold.map((f) => FORMAT_LABELS[f]).join(" · ")
}

/** The small muted line under a product name. Real fields only, no filler. */
export function subline(product: Product): string {
  return [product.team, product.scale].filter(Boolean).join(" · ")
}

/**
 * The corner badge on a card. Sold out outranks featured — a shopper needs to
 * know they can't have it before they're told everyone else wants it.
 */
export function cardTag(product: Product): string | null {
  if (soldFormats(product).length === 0) return "Unavailable"
  if (!product.inStock) return "Sold out"
  if (product.featured) return "Best seller"
  return null
}

/** The spec grid on the product page, built from what the build actually records. */
export function specs(product: Product): { label: string; value: string }[] {
  return [
    { label: "Pieces", value: product.pieces.toLocaleString("en-PK") },
    { label: "Scale", value: product.scale },
    { label: "Edition", value: product.edition },
    { label: "Available as", value: formatSummary(product) },
  ]
}

/** What a card advertises: the cheapest format on sale. */
export { fromPrice }
