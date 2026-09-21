/**
 * Types, and the pure helpers the UI shares.
 *
 * The catalogue, categories, reviews, FAQ and settings come from Supabase — see
 * `src/lib/shop.ts`. Copy with no admin screen lives in `src/content/`, and the
 * strings a card shows are derived in `src/lib/product-view.ts`.
 */

/**
 * A category is whatever the admin has created — a row in `categories`, not a
 * fixed list. Builds carry the category's name; `StoreCategory.slug` is what the
 * shop filters on, so renaming one doesn't break a link somebody has shared.
 * Empty for a display, which belongs to no shopper-facing category.
 */
export type Category = string

/**
 * How assembled a build arrives.
 *
 * The stored keys are still "boxed" and "built" — they already meant exactly
 * this, and renaming them would rewrite what every past order says it sold. Only
 * the labels changed. "framed" remains in the type because order lines written
 * before the frame became an extra still carry it, and the cart and the order
 * history have to be able to name what they hold; nothing offers it any more.
 */
export type FormatKey = "built" | "boxed" | "framed"

/**
 * The assemblies a build is actually priced in.
 *
 * "framed" is a FormatKey so that an order line written before the frame became
 * an extra can still name what it sold, but it never had a price of its own
 * again once `price_framed` was retired — so it is not one of these, and
 * `prices` below does not carry it.
 */
export type SoldFormat = Exclude<FormatKey, "framed">

/** What a shopper can choose today. Never includes the retired "framed". */
export const FORMAT_KEYS: SoldFormat[] = ["boxed", "built"]

export const FORMAT_LABELS: Record<FormatKey, string> = {
  boxed: "Unassembled",
  built: "Assembled",
  framed: "Framed + LED",
}

/**
 * A model is priced per format (see `prices` below); a display is priced per
 * size instead, through `variants` — the two kinds share a catalogue row shape
 * but never the same pricing path.
 */
export type ProductKind = "model" | "display"

/**
 * A video on a build's page: one you uploaded, or one already on YouTube or
 * Vimeo.
 *
 * `src` is a public file URL for an upload and the video's id at its provider
 * otherwise — never a whole pasted address. The player URL is built from these
 * two fields, so the only thing that can reach an iframe is an embed this code
 * constructed. The database enforces the same shapes.
 */
export type ProductVideo = {
  provider: "upload" | "youtube" | "vimeo"
  src: string
  title: string
}

/** One size a display can be ordered in, stocked on its own shelf. */
export type Variant = {
  id: string
  label: string
  price: number
  /** How many are left. `inStock` is this being above zero, nothing more. */
  stock: number
  inStock: boolean
}

export type Product = {
  slug: string
  name: string
  team: string
  category: Category
  kind: ProductKind
  /**
   * What each format costs, in PKR. Every format is priced on its own — there
   * is no base price and no uplift. A format this build isn't sold in sits at
   * zero and is never shown. Unused for a display, which is priced through
   * `variants` instead.
   */
  prices: Record<SoldFormat, number>
  scale: string
  pieces: number
  edition: string
  /** Full image URLs, primary first. */
  images: string[]
  /** A CSS colour or gradient. Displays only — stands in when there is no photograph. */
  swatch: string
  blurb: string
  description: string
  /** Whether it can be bought unassembled, assembled, or either. Unused for a display. */
  formats: Record<FormatKey, boolean>
  /**
   * The frame, sold on top of whichever assembly is chosen rather than as a
   * bundle — so an unassembled kit can be bought with a frame to put it in
   * later. Each price is the frame alone, never a total, and a zero means that
   * kind of frame isn't offered on this build.
   */
  frame: { offered: boolean; plain: number; led: number }
  /** At most two. Empty when none have been added. */
  videos: ProductVideo[]
  /** The sizes a display comes in, priced and stocked independently. Empty for a model. */
  variants: Variant[]
  /**
   * How many can be sold. One number per build: a model's two assemblies both come
   * off the same kit, and a display's is the sum of its variants. Goes negative
   * only when two orders for the last unit are both marked paid.
   */
  stock: number
  /** `stock > 0`, and never anything else — the database generates it. */
  inStock: boolean
  featured: boolean
}

export type StoreCategory = {
  /** What the shop filters on, and what `?cat=` carries. Survives a rename. */
  slug: string
  name: Category
  blurb: string
  image: string
}

export type Review = {
  name: string
  handle: string
  text: string
  build: string
}

export type FaqItem = {
  q: string
  a: string
}

export type Settings = {
  leadTimes: { standard: string; framed: string }
  instagram: string
  /**
   * At or below this many left, a card says so. Set in the admin; zero turns the
   * nudge off entirely rather than showing it on the last one.
   */
  lowStockAt: number
}

export type Guide = {
  slug: string
  title: string
  desc: string
  pages: number
  icon: string
  chapters: { title: string; body: string }[]
}

/**
 * The lowest price this build can be had for — what "from" means on a card or
 * in a sort. A model prices across the formats it is actually sold in; a
 * display has no formats, so it prices across the sizes currently in stock,
 * and reads as free-to-quote (0) when none are.
 */
export function fromPrice(product: Product): number {
  if (product.kind === "display") {
    const inStock = product.variants.filter((v) => v.stock > 0).map((v) => v.price)
    return inStock.length ? Math.min(...inStock) : 0
  }
  const sold = FORMAT_KEYS.filter((f) => product.formats[f]).map((f) => product.prices[f])
  return sold.length ? Math.min(...sold) : product.prices.boxed
}

/**
 * Which frame went with a line, if any.
 *
 * A frame can be had lit or unlit — they are different objects at different
 * prices, so this is a choice of three rather than a yes/no.
 */
export type FrameChoice = "none" | "plain" | "led"

/** What that kind of frame costs on this build. Zero when it isn't offered. */
export function framePrice(product: Product, frame: FrameChoice): number {
  if (!product.frame.offered || frame === "none") return 0
  return frame === "led" ? product.frame.led : product.frame.plain
}

/** The frames this build actually sells, in the order they are offered. */
export function frameChoices(product: Product): FrameChoice[] {
  if (!product.frame.offered) return []
  const out: FrameChoice[] = []
  if (product.frame.plain > 0) out.push("plain")
  if (product.frame.led > 0) out.push("led")
  return out
}

export const FRAME_LABELS: Record<Exclude<FrameChoice, "none">, string> = {
  plain: "Display frame",
  led: "Display frame with LED",
}

/** What a build costs assembled that way, with whichever frame was asked for. */
export function priceOf(product: Product, format: FormatKey, frame: FrameChoice): number {
  // A line still carrying the retired "framed" is refused long before it reaches
  // a total — CheckoutView marks it unavailable and place_order rejects it. This
  // only stops the arithmetic turning into NaN on the way to being refused.
  if (format === "framed") return 0
  return product.prices[format] + framePrice(product, frame)
}

/**
 * The player address for a video.
 *
 * Built here from a provider and an id rather than stored, so no pasted string
 * ever reaches an iframe. An upload is served as a file and gets no embed.
 */
export function embedUrl(video: ProductVideo): string | null {
  if (video.provider === "youtube") return `https://www.youtube-nocookie.com/embed/${video.src}`
  if (video.provider === "vimeo") return `https://player.vimeo.com/video/${video.src}`
  return null
}

/**
 * The price brackets the shop can be filtered by.
 *
 * Fixed in code rather than rows in the database, because a bracket is a way of
 * reading the catalogue, not a thing the catalogue contains. A build is in one
 * because of what it costs — nobody files it there, and nobody has to re-file it
 * when the price changes. That is exactly what separates a bracket from a
 * category, which a build belongs to because somebody said so.
 *
 * Both bounds are inclusive. Prices are whole rupees — the columns are integers
 * and money() renders no decimals — so the three tile the range with no gap and
 * no overlap, and the labels are true at the boundaries: a build at exactly
 * 10,000 reads "Rs 10,000 – 25,000", never "Under Rs 10,000".
 */
export type PriceBand = {
  id: string
  /** For a chip or an option. */
  label: string
  /** For a sentence: "6 builds in Cars under Rs 10,000". */
  phrase: string
  min: number
  /** Null for the open-ended top bracket. */
  max: number | null
}

export const PRICE_BANDS: PriceBand[] = [
  { id: "under-10k", label: "Under Rs 10,000", phrase: "under Rs 10,000", min: 0, max: 9_999 },
  { id: "10k-25k", label: "Rs 10,000 – 25,000", phrase: "from Rs 10,000 to 25,000", min: 10_000, max: 25_000 },
  { id: "over-25k", label: "Over Rs 25,000", phrase: "over Rs 25,000", min: 25_001, max: null },
]

/**
 * Whether a build's "from" price falls inside a bracket.
 *
 * Compares the very number the card prints, so what you filtered by is what you
 * then read — which is why the test for "has a price at all" has to be the same
 * one the card uses to decide whether to print it. A card shows "Not available"
 * instead of a price whenever the build can't be bought: sold out, or sold in no
 * format at all. Letting such a build through would answer "under Rs 10,000"
 * with a card that names no price, and nothing on screen would say why it is
 * there.
 *
 * So a build with no price to show is in no bracket. It still appears under
 * "All", and still in its category — only the brackets, which are about price
 * alone, leave it out.
 *
 * This mirrors isSellable() in lib/product-view.ts. It is not imported from
 * there because that module is presentation and this one is meant to stay free
 * of it; if the rule changes, change both.
 */
export function inPriceBand(product: Product, band: PriceBand): boolean {
  const hasPrice =
    product.inStock &&
    (product.kind === "display"
      ? product.variants.some((v) => v.stock > 0)
      : FORMAT_KEYS.some((f) => product.formats[f]))
  if (!hasPrice) return false

  const price = fromPrice(product)
  return price >= band.min && (band.max === null || price <= band.max)
}

export type ShippingMethod = "standard" | "teamhq"

export type DeliveryOption = {
  id: ShippingMethod
  label: string
  detail: string
  /** Added to the order total. Zero for standard. */
  fee: number
  /** Towns this option reaches. Empty means everywhere. */
  cities: string[]
  /** Who does the delivering, if it isn't us. */
  link?: string
}

/**
 * Cities are typed by hand, so compare on letters alone — "islamabad.",
 * "Islamabad" and "Islamabad Capital Territory" all have to count as the same
 * place. Mirrors private.city_qualifies() in the database, which is what
 * actually decides; this copy only drives the UI.
 */
export function cityQualifies(option: DeliveryOption, city: string): boolean {
  if (option.cities.length === 0) return true
  const typed = city.toLowerCase().replace(/[^a-z]/g, "")
  if (!typed) return false
  return option.cities.some((c) => {
    const want = c.toLowerCase().replace(/[^a-z]/g, "")
    return want.length > 0 && typed.includes(want)
  })
}

export type WalletAccount = { title: string; number: string }

/**
 * How a shopper pays. Read only by the checkout, so it is fetched there rather
 * than on every page with the rest of the settings.
 */
export type PaymentDetails = {
  /** Digits with country code, ready for a wa.me link. Empty if unset. */
  whatsapp: string
  bank: { name: string; title: string; number: string; iban: string }
  jazzcash: WalletAccount
  easypaisa: WalletAccount
}

/**
 * Checkout needs somewhere to send the money and somewhere to send the proof.
 * Missing either, the shop takes no orders — better than collecting an address
 * and then having nothing to tell the customer.
 */
export function canCheckout(p: PaymentDetails): boolean {
  const hasAccount = Boolean(
    (p.bank.title && (p.bank.number || p.bank.iban)) || p.jazzcash.number || p.easypaisa.number,
  )
  return p.whatsapp.length >= 10 && hasAccount
}
