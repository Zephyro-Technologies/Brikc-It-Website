import type { FormatKey, FrameChoice, ShippingMethod } from "../data"
import { FORMAT_LABELS, FRAME_LABELS } from "../data"

/**
 * What the database tells /api/emails about an order — built by
 * `private.order_email_payload()` in the admin repo, which is the other half of
 * this shape. Everything an email needs is in it, because this app holds only
 * the publishable key and cannot read an order back.
 */

export type OrderEmailKind = "placed" | "review" | "review_reminder"

export type OrderEventLine = {
  name: string
  qty: number
  format: FormatKey | null
  /** A display's size or finish; empty for anything else. */
  variant: string
  frame: FrameChoice
  bundle: boolean
  unitPrice: number
}

export type OrderEvent = {
  kind: OrderEmailKind
  number: string
  source: "storefront" | "manual"
  placedAt: string
  /** Whether the customer is sent the payment details. The database decides. */
  paymentEmail: boolean
  /** Who hears about a new order: comma-separated, from Vault. Empty except for "placed". */
  alertTo: string
  customer: { name: string; email: string; phone: string }
  address: { line1: string; line2: string; city: string; province: string; postcode: string }
  method: ShippingMethod
  subtotal: number
  shipping: number
  discount: number
  coupon: string
  total: number
  lines: OrderEventLine[]
  /** The models in the order, each of which can be reviewed on its own page. */
  builds: { name: string; slug: string }[]
}

const KINDS: OrderEmailKind[] = ["placed", "review", "review_reminder"]

const str = (v: unknown) => (typeof v === "string" ? v : "")
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0)
const obj = (v: unknown) => (typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {})

/** The body as the database sent it, or null for anything that isn't one. */
export function readOrderEvent(body: unknown): OrderEvent | null {
  const b = obj(body)
  const kind = KINDS.find((k) => k === b.kind)
  const number = str(b.number)
  if (!kind || !number) return null

  const customer = obj(b.customer)
  const address = obj(b.address)

  return {
    kind,
    number,
    source: b.source === "manual" ? "manual" : "storefront",
    placedAt: str(b.placedAt),
    paymentEmail: b.paymentEmail === true,
    alertTo: str(b.alertTo),
    customer: { name: str(customer.name).trim(), email: str(customer.email).trim(), phone: str(customer.phone).trim() },
    address: {
      line1: str(address.line1),
      line2: str(address.line2),
      city: str(address.city),
      province: str(address.province),
      postcode: str(address.postcode),
    },
    method: b.method === "teamhq" ? "teamhq" : "standard",
    subtotal: num(b.subtotal),
    shipping: num(b.shipping),
    discount: num(b.discount),
    coupon: str(b.coupon),
    total: num(b.total),
    lines: (Array.isArray(b.lines) ? b.lines : []).map((raw) => {
      const l = obj(raw)
      return {
        name: str(l.name),
        qty: num(l.qty),
        format: l.format === "boxed" || l.format === "built" || l.format === "framed" ? l.format : null,
        variant: str(l.variant),
        frame: l.frame === "plain" || l.frame === "led" ? l.frame : "none",
        bundle: l.bundle === true,
        unitPrice: num(l.unitPrice),
      }
    }),
    builds: (Array.isArray(b.builds) ? b.builds : [])
      .map((raw) => ({ name: str(obj(raw).name), slug: str(obj(raw).slug) }))
      .filter((build) => build.name && build.slug),
  }
}

/**
 * What a line is, in words — "Assembled + display frame with LED", "60×90cm",
 * "Bundle". The words `lineLabel()` in src/cart.tsx uses for a cart line,
 * written again here because that module is a client component.
 */
export function eventLineLabel(line: OrderEventLine): string {
  if (line.bundle) return "Bundle"
  if (!line.format) return line.variant
  const base = FORMAT_LABELS[line.format]
  if (line.frame === "none") return base
  // Only the first letter: "display frame with LED", not "…with led".
  const frame = FRAME_LABELS[line.frame]
  return `${base} + ${frame[0].toLowerCase()}${frame.slice(1)}`
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? ""
