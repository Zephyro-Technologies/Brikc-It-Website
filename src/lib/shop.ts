import { supabase } from "./supabase/client"
import { normaliseWhatsapp } from "./checkout"
import type {
  Category,
  FaqItem,
  FormatKey,
  PaymentDetails,
  Product,
  Review,
  Settings,
  StoreCategory,
} from "../data"

/**
 * Every read the storefront makes. Rows are mapped into the shapes the
 * components already expect, so moving from the old static `data.ts` to the
 * database didn't ripple through the UI.
 */

const PRODUCT_SELECT = `
  slug, name, team, category, price, scale, pieces, edition, blurb, description,
  sells_boxed, sells_built, sells_framed, featured, in_stock,
  product_images ( url, sort )
`

type ProductRow = {
  slug: string
  name: string
  team: string
  category: Category
  price: number
  scale: string
  pieces: number
  edition: string
  blurb: string
  description: string
  sells_boxed: boolean
  sells_built: boolean
  sells_framed: boolean
  featured: boolean
  in_stock: boolean
  product_images: { url: string; sort: number }[]
}

function toProduct(row: ProductRow): Product {
  return {
    slug: row.slug,
    name: row.name,
    team: row.team,
    category: row.category,
    price: row.price,
    scale: row.scale,
    pieces: row.pieces,
    edition: row.edition,
    blurb: row.blurb,
    description: row.description,
    images: [...row.product_images].sort((a, b) => a.sort - b.sort).map((i) => i.url),
    formats: { boxed: row.sells_boxed, built: row.sells_built, framed: row.sells_framed },
    inStock: row.in_stock,
    featured: row.featured,
  }
}

/** Supabase surfaces failures in `error` rather than throwing, so unwrap loudly —
 *  a silent empty catalogue is far worse than a build that stops. */
function unwrap<T>(what: string, res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Supabase: failed to load ${what} — ${res.error.message}`)
  if (res.data === null) throw new Error(`Supabase: no data returned for ${what}`)
  return res.data
}

export async function getProducts(): Promise<Product[]> {
  const res = await supabase().from("products").select(PRODUCT_SELECT).order("created_at")
  return (unwrap("products", res) as unknown as ProductRow[]).map(toProduct)
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const res = await supabase().from("products").select(PRODUCT_SELECT).eq("slug", slug).maybeSingle()
  if (res.error) throw new Error(`Supabase: failed to load product ${slug} — ${res.error.message}`)
  return res.data ? toProduct(res.data as unknown as ProductRow) : undefined
}

export async function getProductSlugs(): Promise<string[]> {
  const res = await supabase().from("products").select("slug")
  return unwrap("product slugs", res).map((r) => r.slug)
}

export async function getCategories(): Promise<StoreCategory[]> {
  const res = await supabase().from("categories").select("name, blurb, image, sort").order("sort")
  return unwrap("categories", res).map((c) => ({
    name: c.name as Category,
    blurb: c.blurb,
    image: c.image,
  }))
}

export async function getReviews(): Promise<Review[]> {
  const res = await supabase().from("reviews").select("name, handle, quote, build, sort").order("sort")
  return unwrap("reviews", res).map((r) => ({
    name: r.name,
    handle: r.handle,
    text: r.quote,
    build: r.build,
  }))
}

export async function getFaqs(): Promise<FaqItem[]> {
  const res = await supabase().from("faqs").select("question, answer, sort").order("sort")
  return unwrap("FAQ", res).map((f) => ({ q: f.question, a: f.answer }))
}

export async function getSettings(): Promise<Settings> {
  const res = await supabase()
    .from("settings")
    .select("uplift_built, uplift_framed, lead_time_standard, lead_time_framed, instagram")
    .limit(1)
    .maybeSingle()
  if (res.error) throw new Error(`Supabase: failed to load settings — ${res.error.message}`)
  if (!res.data) throw new Error("Supabase: the settings row is missing — has the seed been applied?")

  const uplift: Record<FormatKey, number> = {
    boxed: 0,
    built: res.data.uplift_built,
    framed: res.data.uplift_framed,
  }
  return {
    uplift,
    leadTimes: { standard: res.data.lead_time_standard, framed: res.data.lead_time_framed },
    instagram: res.data.instagram,
  }
}

/**
 * Kept apart from getSettings because only the checkout needs it — the root
 * layout fetches settings on every single page and has no use for a bank
 * account number.
 */
export async function getPaymentDetails(): Promise<PaymentDetails> {
  const res = await supabase()
    .from("settings")
    // One literal, not a concatenation: supabase-js parses this string at the
    // type level to work out the row shape, and only a literal survives that.
    .select(
      "whatsapp, bank_name, bank_account_title, bank_account_number, bank_iban, jazzcash_title, jazzcash_number, easypaisa_title, easypaisa_number",
    )
    .limit(1)
    .maybeSingle()
  if (res.error) throw new Error(`Supabase: failed to load payment details — ${res.error.message}`)
  if (!res.data) throw new Error("Supabase: the settings row is missing — has the seed been applied?")

  return {
    whatsapp: normaliseWhatsapp(res.data.whatsapp),
    bank: {
      name: res.data.bank_name,
      title: res.data.bank_account_title,
      number: res.data.bank_account_number,
      iban: res.data.bank_iban,
    },
    jazzcash: { title: res.data.jazzcash_title, number: res.data.jazzcash_number },
    easypaisa: { title: res.data.easypaisa_title, number: res.data.easypaisa_number },
  }
}
