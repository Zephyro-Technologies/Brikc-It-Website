/**
 * Types, and the copy that deliberately lives in code rather than the database.
 *
 * The catalogue, categories, reviews, FAQ and pricing settings now come from
 * Supabase — see `src/lib/shop.ts`. What stays here is homepage copy the admin
 * has no screen for: the three format cards and the how-it-works steps.
 */

export type Category = "F1" | "Cars" | "Bikes" | "Collector"

export type FormatKey = "built" | "boxed" | "framed"

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
  /** Base (boxed) price in PKR. Built and framed add an uplift from settings. */
  price: number
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
  /** Added on top of a product's base price. Boxed is always zero. */
  uplift: Record<FormatKey, number>
  leadTimes: { standard: string; framed: string }
  instagram: string
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
