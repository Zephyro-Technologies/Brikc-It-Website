import { useEffect, useRef } from "react"
import { fromPrice, type Product } from "../data"

/**
 * The Meta Pixel, from the page's side: the events the shop reports and the
 * one function that sends them.
 *
 * PageView is not here: Meta's snippet counts the first page and fbevents.js
 * counts every navigation after it — see MetaPixel.
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
 * AddToCart price is the catalogue's number as the page shows it; the Purchase
 * value is the total place_order returned. None of it travels to the shop.
 */

type StandardEvent = "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase"
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
 * as a repeat — the order number, for a Purchase.
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

/**
 * One ViewContent per build a shopper opens — keyed on the slug, because the
 * detail views are reused when a shopper follows a suggestion to another build.
 * The value is the "from" price the cards quote; a build nobody can order right
 * now is still a view, just without one. The ref makes it one per build even
 * where React runs an effect twice, as it does in development.
 */
export function useViewContent(product: Product | undefined) {
  const slug = product?.slug
  const sent = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!product || sent.current === product.slug) return
    sent.current = product.slug
    const price = fromPrice(product)
    track("ViewContent", {
      content_ids: [product.slug],
      content_name: product.name,
      content_type: "product",
      ...(price > 0 && { value: price, currency: CURRENCY }),
    })
  }, [slug])
}
