/**
 * Types, and the copy that deliberately lives in code rather than the database.
 *
 * The catalogue, categories, reviews, FAQ and pricing settings now come from
 * Supabase — see `src/lib/shop.ts`. What stays here is homepage copy the admin
 * has no screen for: the three format cards and the how-it-works steps.
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

/* ── Copy that stays in code ─────────────────────────────────────────────── */

export const FORMATS = [
  {
    tag: "01 / BUILT",
    title: "Built",
    copy: "Fully assembled by hand, cleaned, and inspected. Arrives ready to display straight out of the box.",
    highlight: false,
  },
  {
    tag: "02 / BOXED",
    title: "Boxed",
    copy: "Sealed and unbuilt for the purists who want the whole ritual. The exact set, sourced and shipped safely.",
    highlight: false,
  },
  {
    tag: "03 / FRAMED",
    title: "Framed",
    copy: "Mounted in a custom shadow-box with an integrated LED strip. Your build becomes a piece of wall art.",
    highlight: true,
  },
]

export const STEPS = [
  { n: "01", t: "Pick a build", d: "Browse F1, cars, and bikes, or grab a limited collector set." },
  { n: "02", t: "Choose the format", d: "Built, boxed, or framed with LED. Set per item at checkout." },
  { n: "03", t: "Add to cart", d: "Secure checkout. We confirm specs, lead time, and ship it safe." },
]
