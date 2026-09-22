import {
  FORMAT_KEYS,
  FORMAT_LABELS,
  frameChoices,
  fromPrice,
  type FormatKey,
  type Product,
  type SoldFormat,
  type Variant,
} from "../data"

/**
 * Presentation helpers that turn a catalogue row into the strings the cards and
 * the product page show.
 *
 * The design came from a prototype whose products had a single price, one
 * image and a hand-written "sub" line. Real builds have three per-format
 * prices, a stock flag and per-format availability, so everything the design
 * asks for is derived here rather than invented — one place to look when a
 * label reads wrong.
 *
 * A product is now either a model (formats) or a display (variants), and
 * every helper below has to be right for both.
 */

/**
 * How many are left, if that is few enough to be worth saying.
 *
 * Above the threshold a shopper learns nothing useful from a number and the
 * shop gives away what it holds, so nothing is shown. At zero the card already
 * says "Sold out" and the Add button is gone, so nothing is shown there either
 * — this is only the band in between. A threshold of zero turns it off.
 */
export function lowStockNote(product: Product, lowStockAt: number): string | null {
  if (lowStockAt <= 0) return null
  if (product.stock <= 0 || product.stock > lowStockAt) return null
  return product.stock === 1 ? "Only 1 left" : `Only ${product.stock} left`
}

/** The same line for one size of a display, which is stocked on its own. */
export function lowVariantStockNote(variant: Variant, lowStockAt: number): string | null {
  if (lowStockAt <= 0) return null
  if (variant.stock <= 0 || variant.stock > lowStockAt) return null
  return variant.stock === 1 ? "Only 1 left" : `Only ${variant.stock} left`
}

/** The formats this build is actually sold in, in display order. Empty for a display. */
export function soldFormats(product: Product): SoldFormat[] {
  // Neither a display nor a bundle is sold by assembly — a bundle's members
  // had theirs fixed when it was built.
  if (product.kind !== "model") return []
  return FORMAT_KEYS.filter((f) => product.formats[f])
}

/** The sizes a display currently has on hand, in the order the catalogue lists them. */
export function variantsInStock(product: Product): Variant[] {
  return product.variants.filter((v) => v.inStock)
}

/**
 * Whether a shopper can actually buy this build right now.
 *
 * Stock is only half of it: a build with every format switched off (or, for a
 * display, no size currently in stock) is in stock and unbuyable. `place_order`
 * rejects such a line anyway, but a card that offers an Add button for it
 * turns a catalogue mistake into a shopper's dead end at checkout, so nothing
 * offers it in the first place.
 */
export function isSellable(product: Product): boolean {
  if (product.kind === "display") return product.inStock && variantsInStock(product).length > 0
  if (product.kind === "bundle") {
    // Priced, filled, in stock, and every member still orderable. The stock
    // already accounts for the members' counts — it is derived from them —
    // but a member that has stopped being sold in the format the bundle
    // fixed is in stock and unbuyable, which place_order would refuse.
    return (
      product.inStock &&
      product.bundlePrice > 0 &&
      product.bundleItems.length > 0 &&
      product.bundleItems.every((i) => i.available)
    )
  }
  return product.inStock && soldFormats(product).length > 0
}

/**
 * The format a "from" price refers to — the cheapest one on sale. Quick-add on
 * a card uses this, so the price shown and the price added always agree.
 *
 * Callers must gate on isSellable() first; the "boxed" fallback here exists
 * only so the type stays total, and adding it would be rejected server-side.
 * Models only — see cheapestVariant() for a display.
 */
export function cheapestFormat(product: Product): FormatKey {
  const sold = soldFormats(product)
  if (sold.length === 0) return "boxed"
  return sold.reduce((best, f) => (product.prices[f] < product.prices[best] ? f : best), sold[0])
}

/**
 * The size a "from" price refers to — the cheapest in-stock variant. Quick-add
 * on a display card uses this. Null when nothing is in stock to add.
 */
export function cheapestVariant(product: Product): Variant | null {
  const inStock = variantsInStock(product)
  if (inStock.length === 0) return null
  return inStock.reduce((best, v) => (v.price < best.price ? v : best), inStock[0])
}


/** "60×90cm · 90×140cm" — the sizes a display comes in. */
function variantSummary(product: Product): string {
  if (product.variants.length === 0) return "Not currently sized"
  return product.variants.map((v) => v.label).join(" · ")
}

/**
 * A flat tile in the surface colour, used when a build has no photograph.
 *
 * The admin's product form insists on at least one image, but nothing in the
 * database enforces it, so a row can legitimately arrive with none — and React
 * drops `src={undefined}` entirely, emitting an <img> with no src at all. An
 * empty tile is a fine thing to show; invalid markup is not.
 */
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%201%201'%3E%3Crect%20width%3D'1'%20height%3D'1'%20fill%3D'%23eceae7'%2F%3E%3C%2Fsvg%3E"

/** The image to show for a build, falling back to the placeholder tile. */
export function productImage(product: Product, index = 0): string {
  return product.images[index] ?? PLACEHOLDER_IMAGE
}

/**
 * What a display card shows when there is no photograph: its swatch, not the
 * neutral placeholder tile — a colour or finish says more than an empty tile
 * does. A model always has the placeholder as its fallback and has no swatch
 * to fall back to.
 */
export function displayVisual(product: Product): { kind: "image" | "swatch"; value: string } {
  const image = product.images[0]
  if (image) return { kind: "image", value: image }
  return { kind: "swatch", value: product.swatch }
}

/** The small muted line under a product name. Real fields only, no filler. */
export function subline(product: Product): string {
  if (product.kind === "display") return [product.team, product.blurb].filter(Boolean).join(" · ")
  if (product.kind === "bundle") {
    const count = product.bundleItems.reduce((n, i) => n + i.qty, 0)
    return [product.team, count > 0 ? `${count} builds together` : ""].filter(Boolean).join(" · ")
  }
  return [product.team, product.scale].filter(Boolean).join(" · ")
}

/**
 * The corner badge on a card. Sold out outranks featured — a shopper needs to
 * know they can't have it before they're told everyone else wants it.
 */
export function cardTag(product: Product): string | null {
  const hasAnythingToSell =
    product.kind === "display"
      ? variantsInStock(product).length > 0
      : product.kind === "bundle"
        ? product.bundlePrice > 0 &&
          product.bundleItems.length > 0 &&
          product.bundleItems.every((i) => i.available)
        : soldFormats(product).length > 0
  if (!hasAnythingToSell) return "Unavailable"
  if (!product.inStock) return "Sold out"
  // A bundle says what it is before it says how popular it is: "Bundle" is
  // what makes the price on the card make sense.
  if (product.kind === "bundle") return "Bundle"
  if (product.featured) return "Best seller"
  return null
}

/** The spec grid on the product page, built from what the build actually records. */
export function specs(product: Product): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = []
  // A display has no piece count or scale — omit rather than show "0" or "".
  if (product.pieces > 0) rows.push({ label: "Pieces", value: product.pieces.toLocaleString("en-PK") })
  if (product.scale) rows.push({ label: "Scale", value: product.scale })
  rows.push({ label: "Edition", value: product.edition })
  // A display's sizes are worth stating; a model's assemblies are not. The
  // grid now sits directly above the Unassembled/Assembled toggle and the
  // frame chooser, so "Available as" was reading the controls back out.
  if (product.kind === "display") rows.push({ label: "Sizes", value: variantSummary(product) })
  // A bundle's own piece count and scale are meaningless — they belong to its
  // members, which the page lists in full underneath.
  if (product.kind === "bundle") {
    return [
      { label: "In the bundle", value: `${product.bundleItems.reduce((n, i) => n + i.qty, 0)} builds` },
      { label: "Edition", value: product.edition },
    ]
  }
  return rows
}

/**
 * What a card advertises: the cheapest sold format for a model, the cheapest
 * in-stock size for a display. Kind-aware, so it lives with the rest of the
 * shared helpers in data.ts rather than being duplicated here.
 */
export { fromPrice }
