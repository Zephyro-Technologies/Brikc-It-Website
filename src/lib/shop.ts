import { supabase } from "./supabase/client"
import { normaliseWhatsapp } from "./checkout"
import type {
  Category,
  DeliveryOption,
  DisplayFinish,
  FaqItem,
  FormatKey,
  Guide,
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
  slug, name, team, category, price_boxed, price_built, price_framed,
  scale, pieces, edition, blurb, description,
  sells_boxed, sells_built, sells_framed, featured, in_stock,
  product_images ( url, sort )
`

type ProductRow = {
  slug: string
  name: string
  team: string
  category: Category
  price_boxed: number
  price_built: number
  price_framed: number
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
    prices: { boxed: row.price_boxed, built: row.price_built, framed: row.price_framed },
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
    .select("lead_time_standard, lead_time_framed, instagram")
    .limit(1)
    .maybeSingle()
  if (res.error) throw new Error(`Supabase: failed to load settings — ${res.error.message}`)
  if (!res.data) throw new Error("Supabase: the settings row is missing — has the seed been applied?")

  return {
    leadTimes: { standard: res.data.lead_time_standard, framed: res.data.lead_time_framed },
    instagram: res.data.instagram,
  }
}

/**
 * What delivery choices the shopper gets. Standard is always there and always
 * free; hand delivery only appears when it has been configured with somewhere
 * to deliver to.
 */
export async function getDeliveryOptions(): Promise<DeliveryOption[]> {
  const res = await supabase()
    .from("settings")
    .select("teamhq_fee, teamhq_cities, teamhq_instagram")
    .limit(1)
    .maybeSingle()
  if (res.error) throw new Error(`Supabase: failed to load delivery options — ${res.error.message}`)
  // Fail as loudly as getSettings() and getPaymentDetails() do. Without this,
  // a missing settings row degrades silently to standard-delivery-only: hand
  // delivery just stops being offered, which looks like a deliberate change
  // rather than a broken database.
  if (!res.data) throw new Error("Supabase: the settings row is missing — has the seed been applied?")

  const options: DeliveryOption[] = [
    {
      id: "standard",
      label: "Standard delivery",
      detail: "Tracked courier, anywhere in Pakistan.",
      fee: 0,
      cities: [],
    },
  ]

  const cities = (res.data?.teamhq_cities ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)

  if (cities.length > 0) {
    options.push({
      id: "teamhq",
      label: "Hand delivery by TEAM HQ",
      detail: `Brought to your door in person. ${cities.join(" and ")} only.`,
      fee: res.data?.teamhq_fee ?? 0,
      cities,
      link: res.data?.teamhq_instagram || undefined,
    })
  }

  return options
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

export async function getDisplayFinishes(): Promise<DisplayFinish[]> {
  const res = await supabase()
    .from("display_finishes")
    .select("name, finish, from_price, swatch, image, sort")
    .order("sort")
  return unwrap("display finishes", res).map((f) => ({
    name: f.name,
    finish: f.finish,
    from: f.from_price,
    swatch: f.swatch,
    image: f.image,
  }))
}

const GUIDE_SELECT = `
  slug, title, description, pages, icon,
  guide_chapters ( title, body, sort )
`

type GuideRow = {
  slug: string
  title: string
  description: string
  pages: number
  icon: string
  guide_chapters: { title: string; body: string; sort: number }[]
}

function toGuide(row: GuideRow): Guide {
  return {
    slug: row.slug,
    title: row.title,
    desc: row.description,
    pages: row.pages,
    icon: row.icon,
    chapters: [...row.guide_chapters]
      .sort((a, b) => a.sort - b.sort)
      .map((c) => ({ title: c.title, body: c.body })),
  }
}

export async function getGuides(): Promise<Guide[]> {
  const res = await supabase().from("guides").select(GUIDE_SELECT).order("sort")
  return (unwrap("guides", res) as unknown as GuideRow[]).map(toGuide)
}

export async function getGuide(slug: string): Promise<Guide | undefined> {
  const res = await supabase().from("guides").select(GUIDE_SELECT).eq("slug", slug).maybeSingle()
  if (res.error) throw new Error(`Supabase: failed to load guide ${slug} — ${res.error.message}`)
  return res.data ? toGuide(res.data as unknown as GuideRow) : undefined
}
