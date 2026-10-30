/**
 * The admin's files — product photos, category covers, description images,
 * product videos and assembly manuals — live in the R2 bucket `brikc-it-media`,
 * served straight from this origin with no Worker in the path.
 *
 * They used to be served from Supabase storage, and every card downloaded the
 * full photograph: up to 2800px of WebP, most of a megabyte, to fill a square
 * three hundred pixels wide. That ran the project's cached egress to more than
 * twice the free allowance. So the admin now writes two smaller copies beside
 * every photo it uploads, and the pages ask for those instead.
 *
 * Plain functions with no hooks, because Server Components and client ones both
 * draw photographs.
 */
export const MEDIA_ORIGIN = "https://media.brikc.it"

/**
 * Only these two buckets have copies. A video or a manual has nothing to
 * resize, and customer review media is still on Supabase.
 */
const RESIZED = new RegExp(`^${MEDIA_ORIGIN.replace(/\./g, "\\.")}/(?:product-images|content-images)/[^?#]+\\.[A-Za-z0-9]+$`)
const ALREADY_A_COPY = /\.w(?:640|1280)\.webp$/

/**
 * The copies of a photo on the media origin, or null for anything else.
 *
 * `2026/<uuid>.webp` has `2026/<uuid>.w640.webp` and `2026/<uuid>.w1280.webp`
 * beside it — that width, or the original's if it was narrower, never larger.
 * The names are derived rather than stored, so a URL is all this needs. A photo
 * still on Supabase, the inline placeholder, or an address pasted into a
 * description from elsewhere has no copies, and gets null.
 */
export function mediaCopies(url: string): { w640: string; w1280: string } | null {
  if (!RESIZED.test(url) || ALREADY_A_COPY.test(url)) return null
  const stem = url.slice(0, url.lastIndexOf("."))
  return { w640: `${stem}.w640.webp`, w1280: `${stem}.w1280.webp` }
}

/** The 640px copy where there is one, the URL itself where there isn't. */
export function smallImage(url: string): string {
  return mediaCopies(url)?.w640 ?? url
}

/** The 1280px copy where there is one — what a social preview card wants. */
export function largeImage(url: string): string {
  return mediaCopies(url)?.w1280 ?? url
}

/**
 * The `src`, `srcSet` and `sizes` to spread onto an `<img>`.
 *
 * `sizes` is how wide the image is drawn, which only the caller knows. `full`
 * lets the original compete too, for the hero, which fills a wide screen. A
 * `thumb` is drawn at 80px or less, so it gets the 640 copy alone — a srcset
 * would buy nothing there.
 *
 * Anything not on the media origin comes back as `{ src }`, untouched: there is
 * no smaller copy of it to offer, and naming one that doesn't exist would be a
 * broken image.
 */
export function imageProps(
  url: string,
  opts: { sizes: string; full?: boolean } | { thumb: true },
): { src: string; srcSet?: string; sizes?: string } {
  const copies = mediaCopies(url)
  if (!copies) return { src: url }
  if ("thumb" in opts) return { src: copies.w640 }
  const srcSet = [`${copies.w640} 640w`, `${copies.w1280} 1280w`]
  // The original is at most 2800px wide; claiming that width only ever makes the
  // browser less eager to pick it, never more.
  if (opts.full) srcSet.push(`${url} 2800w`)
  return { src: copies.w1280, srcSet: srcSet.join(", "), sizes: opts.sizes }
}
