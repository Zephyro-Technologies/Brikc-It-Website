import type { Metadata } from "next"
import { FORMAT_LABELS, type Product } from "../data"
import { money } from "./money"
import { isSellable, soldFormats, variantsInStock } from "./product-view"
import { largeImage } from "./media"

/**
 * What search engines and link previews are told about each page.
 *
 * The brand is written "BrikcIt" here, in every title, preview and piece of
 * structured data, so that Google learns one name for the shop. It kept
 * "correcting" brikc to an unrelated app called Brickit; the alternate names
 * below are the spellings people actually type.
 *
 * The models are LEGO sets, imported. LEGO has no presence in Pakistan, so the
 * pages people read never say so: "LEGO" appears only in metadata — titles,
 * descriptions, previews and JSON-LD — plus the trademark notice in the footer.
 * And never "genuine", "original", "authentic", "official" or "authorised",
 * not even here. Displays are the shop's own frames and desks and are never
 * called LEGO anywhere.
 */

export const SITE_URL = "https://brikc.it"
export const BRAND = "BrikcIt"
export const ALTERNATE_NAMES = ["Brikc It", "brikc.it"]

/**
 * The preview for a page with no photograph of its own: the hero's lit display
 * wall, which is already the homepage's fallback picture. 1920×1071 is close
 * enough to the 1.91:1 a large card is drawn at.
 */
const DEFAULT_IMAGE = {
  url: "/brand/hero.jpg",
  width: 1920,
  height: 1071,
  alt: "Builds on lit display shelves",
}

/** Every page's title is "<page> | BrikcIt", set as a template in the root layout. */
export const TITLE_TEMPLATE = `%s | ${BRAND}`

/** The homepage's description, which is also the default for anything that sets none. */
export const SITE_DESCRIPTION =
  "LEGO sets in Pakistan, unassembled in the box or assembled for you, with an optional LED display frame. Prices in rupees and free courier delivery anywhere in Pakistan."

/**
 * The metadata for one indexable page: its title, description, canonical
 * address, and the Open Graph and Twitter cards that go with them.
 *
 * Metadata from a layout and a page is merged shallowly, so a page that sets
 * `openGraph` at all replaces the layout's whole object — site name, locale and
 * image included. Every page therefore takes the full set from here rather than
 * relying on inheritance that does not happen.
 *
 * `title` is what goes in front of " | BrikcIt"; `absolute` skips the suffix,
 * for the homepage, whose title already leads with the brand.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  imageAlt = title,
  absolute = false,
}: {
  title: string
  description: string
  path: string
  image?: string
  /** What the photograph shows — for a build, its name, as on the page. */
  imageAlt?: string
  absolute?: boolean
}): Metadata {
  const full = absolute ? title : `${title} | ${BRAND}`
  const images = image ? [{ url: image, alt: imageAlt }] : [DEFAULT_IMAGE]
  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      siteName: BRAND,
      locale: "en_PK",
      title: full,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: full,
      description,
      images: images.map((i) => i.url),
    },
  }
}

/** For the checkout and the like: still titled, never indexed. */
export function privateMetadata(title: string, description: string): Metadata {
  return { title, description, robots: { index: false, follow: false } }
}

/**
 * Whether a build's metadata may call it a LEGO set. Every model is, on the
 * owner's word — except one whose own page says otherwise. Some were written
 * up in the admin as "a brick-compatible model. Not made or endorsed by the
 * LEGO Group", and a title or a structured-data brand that contradicts the
 * page under it is a brand claim the shop shouldn't make and markup Google
 * treats as misleading. Correcting the description in the admin is what lets
 * the metadata say LEGO again; nothing here overrides what the page says.
 */
const DISCLAIMS_LEGO = /brick[- ]compatible|\bnot (made|endorsed|connected)\b[^.]*\blego\b/i

export function isLegoSet(product: Product): boolean {
  return product.kind === "model" && !DISCLAIMS_LEGO.test(`${product.blurb} ${product.description}`)
}

/**
 * "<name> — LEGO set in Pakistan", without saying LEGO twice when the name
 * already does; "<name> — brick-built model in Pakistan" for a model whose
 * page disclaims LEGO.
 */
export function modelTitle(product: Product): string {
  const { name } = product
  if (!isLegoSet(product)) return `${name} — brick-built model in Pakistan`
  return /\blego\b/i.test(name) ? `${name} in Pakistan` : `${name} — LEGO set in Pakistan`
}

/**
 * Text for a meta description or a JSON-LD `description`: Markdown markers
 * dropped, whitespace collapsed, and cut at a word near `max` characters.
 *
 * Product descriptions are Markdown (src/lib/markdown.tsx draws them), and a
 * search result showing "**Headline**" is worse than one that is a little
 * shorter. This is deliberately cruder than the renderer — it only has to make
 * the text read as prose, not reproduce the page.
 */
export function plainText(markdown: string, max = 300): string {
  const text = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|[-*+]|\d+[.)])\s+/gm, "")
    .replace(/^\s*([-*_]\s*){3,}$/gm, " ")
    .replace(/[*_`]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const space = cut.lastIndexOf(" ")
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.—-]+$/, "")}…`
}

/**
 * Words metadata never uses, even quoting the admin: a description that says
 * "authentic racing stripes" next to "LEGO set" reads as a claim about the set.
 */
const BANNED = /\b(genuine|original|authentic|official|authori[sz]ed)\b/i

/**
 * Admin-written text made fit for metadata: plain prose, with any sentence
 * using one of the banned words dropped whole rather than reworded.
 */
export function metaText(text: string, max = 300): string {
  const prose = plainText(text, 10_000)
  const sentences = prose.match(/[^.!?]+(?:[.!?]+|$)\s*/g) ?? []
  return plainText(sentences.filter((s) => !BANNED.test(s)).join(""), max)
}

/** The product's own words, or the start of its description when it has no blurb. */
function ownWords(product: Product): string {
  return metaText(product.blurb || product.description, 200)
}

/** "Unassembled or assembled", from the formats this build is actually sold in. */
function formatPhrase(product: Product): string {
  const labels = soldFormats(product).map((f) => FORMAT_LABELS[f].toLowerCase())
  if (labels.length === 0) return ""
  const phrase = labels.join(" or ")
  return phrase[0].toUpperCase() + phrase.slice(1)
}

/**
 * A model's meta description. Every fact in it comes from the row: the piece
 * count only when it is recorded, the price only when the build can be bought,
 * and the assemblies only those switched on.
 */
export function modelDescription(product: Product): string {
  const pieces = product.pieces > 0 ? `, ${product.pieces.toLocaleString("en-PK")} pieces` : ""
  const lead = `${product.name}: ${isLegoSet(product) ? "LEGO set" : "brick-built model"}${pieces}.`
  const sale = isSellable(product)
    ? `${formatPhrase(product)}, from ${money(Math.min(...soldFormats(product).map((f) => product.prices[f])))}, with free delivery across Pakistan.`
    : "Free delivery across Pakistan."
  return plainText([lead, sale, ownWords(product)].filter(Boolean).join(" "), 300)
}

/**
 * A display's meta description: its own words, then what it costs. Never LEGO.
 * The price only when the page would sell it — isSellable(), which also wants
 * the display itself in stock, as the page's Add button does.
 */
export function displayDescription(product: Product): string {
  const inStock = variantsInStock(product).filter((v) => v.price > 0)
  const sale =
    isSellable(product) && inStock.length > 0
      ? `From ${money(Math.min(...inStock.map((v) => v.price)))}, with free delivery across Pakistan.`
      : ""
  const own = ownWords(product) || `${product.name}, a display piece by ${BRAND}.`
  return plainText([own, sale].filter(Boolean).join(" "), 300)
}

/** A bundle's: what is in it and what it costs. Members may be displays, so no LEGO. */
export function bundleDescription(product: Product): string {
  const count = product.bundleItems.reduce((n, i) => n + i.qty, 0)
  const sale =
    isSellable(product) && count > 0
      ? `${count} builds together for ${money(product.bundlePrice)}, with free delivery across Pakistan.`
      : ""
  return plainText([ownWords(product), sale].filter(Boolean).join(" "), 300) || product.name
}

/** The 1280 copy of a build's first photograph: a preview card is never drawn wider. */
export function previewImage(product: Product): string | undefined {
  return product.images[0] ? largeImage(product.images[0]) : undefined
}

/** An absolute address on this site, for JSON-LD, which has no metadataBase. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString()
}

/** The Instagram profile for a handle as settings hold it ("@brikc.it" or "brikc.it"), or null. */
export function instagramUrl(handle: string): string | null {
  const name = handle.trim().replace(/^@/, "")
  return name ? `https://www.instagram.com/${name}/` : null
}
