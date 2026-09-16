/**
 * Types, and the pure helpers the UI shares.
 *
 * The catalogue, categories, reviews, FAQ and settings come from Supabase — see
 * `src/lib/shop.ts`. Copy with no admin screen lives in `src/content/`, and the
 * strings a card shows are derived in `src/lib/product-view.ts`.
 */

export type Category = "F1" | "Cars" | "Bikes" | "Collector"

export type FormatKey = "built" | "boxed" | "framed"

export const FORMAT_KEYS: FormatKey[] = ["boxed", "built", "framed"]

export const FORMAT_LABELS: Record<FormatKey, string> = {
  built: "Built",
  boxed: "Boxed",
  framed: "Framed + LED",
}

export type Product = {
  slug: string
  name: string
  team: string
  category: Category
  /**
   * What each format costs, in PKR. Every format is priced on its own — there
   * is no base price and no uplift. A format this build isn't sold in sits at
   * zero and is never shown.
   */
  prices: Record<FormatKey, number>
  scale: string
  pieces: number
  edition: string
  /** Full image URLs, primary first. */
  images: string[]
  blurb: string
  description: string
  /** Which of the three formats this build can be sold as. */
  formats: Record<FormatKey, boolean>
  inStock: boolean
  featured: boolean
}

export type StoreCategory = {
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
}

export type DisplayFinish = {
  name: string
  /** Material and the frame size it is cut for. */
  finish: string
  from: number | null
  /** A CSS colour or gradient for the swatch block. */
  swatch: string
  /** A photograph URL. Takes priority over `swatch` when set. */
  image: string
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
 * The lowest price this build can be had for, across the formats it is
 * actually sold in — what "from" means on a card or in a sort.
 */
export function fromPrice(product: Product): number {
  const sold = FORMAT_KEYS.filter((f) => product.formats[f]).map((f) => product.prices[f])
  return sold.length ? Math.min(...sold) : product.prices.boxed
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
