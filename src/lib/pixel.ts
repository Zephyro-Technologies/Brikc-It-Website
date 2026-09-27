
/**
 * The Meta Pixel, from the page's side: the events the shop reports and the
 * one function that sends them.
 *
 * PageView is not here: Meta's snippet counts the first page and fbevents.js
 * counts every navigation after it — see MetaPixel.
 *
 * No hooks in this file: MetaPixel, a Server Component, imports PIXEL_ID from
 * it, and Next refuses to build a server module whose imports touch React's
 * client hooks. useViewContent lives in its own file for that reason.
 *
 * Every call is a no-op unless the pixel is on. `window.fbq` exists only when
 * `settings.meta_pixel_id` holds an id and MetaPixel has put Meta's snippet in
 * the page, and that snippet runs before hydration — so an event fired while a
 * page mounts is queued rather than lost.
 *
 * A product is named by its slug, the id the rest of the storefront already
 * uses: the cart, the wire format and the URLs all say slug. A catalogue feed
 * built later has to use the same one, or Meta can't match the two.
 *
 * The values here are analytics, not money the shop acts on. A ViewContent or
 * AddToCart price is the catalogue's number as the page shows it; the
 * AddPaymentInfo value is the total place_order returned. None of it travels to
 * the shop.
 */

/**
 * No Purchase: a placed order isn't a sale here. The database sends Purchase to
 * Meta's Conversions API when an order is marked paid.
 */
type StandardEvent = "ViewContent" | "AddToCart" | "InitiateCheckout" | "AddPaymentInfo"
type Fbq = (...args: unknown[]) => void

declare global {
  interface Window {
    fbq?: Fbq
  }
}

/** Prices are whole rupees, and Meta takes a value in major units. */
export const CURRENCY = "PKR"

/** What settings_meta_pixel_id_shape allows. Anything else loads nothing. */
export const PIXEL_ID = /^[0-9]{10,20}$/

/**
 * One standard event. `eventID` makes a repeat of the same event recognisable
 * as a repeat — the order number, for an AddPaymentInfo.
 */
export function track(event: StandardEvent, params: Record<string, unknown> = {}, eventID?: string) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return
  if (eventID) window.fbq("track", event, params, { eventID })
  else window.fbq("track", event, params)
}

export type PixelLine = { slug: string; qty: number }

/** What a set of lines says to Meta: which products, how many of each. */
export function lineParams(lines: PixelLine[]) {
  return {
    content_ids: lines.map((l) => l.slug),
    contents: lines.map((l) => ({ id: l.slug, quantity: l.qty })),
    content_type: "product",
    num_items: lines.reduce((n, l) => n + l.qty, 0),
  }
}
