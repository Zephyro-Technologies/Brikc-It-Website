/**
 * The only shape a cart line takes on the wire.
 *
 * Two routes send lines to Postgres — `/api/orders`, which places the order,
 * and `/api/coupon`, which prices the same cart to work out what a code is
 * worth. They have to agree about what is in the cart, or the discount on
 * screen is a discount on a different cart.
 *
 * Only slug, one of format/variant, which frame, and quantity cross the wire.
 * Anything else a client might send about a line — a name, an image, a price —
 * is dropped here. `frame` names a choice, never an amount: what a frame costs
 * is the database's business. A model line carries format; a display line
 * carries variant; never both, and Postgres rejects the wrong one rather than
 * ignoring it.
 */

export type IncomingLine = {
  slug?: unknown
  format?: unknown
  frame?: unknown
  variant?: unknown
  qty?: unknown
}

export type WireLine =
  | { slug: string; qty: number; variant: string }
  | { slug: string; qty: number; format: string; frame: string }

const str = (v: unknown) => (typeof v === "string" ? v : "")

/** Twenty is the cap `place_order` enforces; trimming here saves a round trip. */
export function wireLines(body: Record<string, unknown>): WireLine[] {
  const raw = Array.isArray(body.lines) ? (body.lines as IncomingLine[]) : []
  return raw.slice(0, 20).map((l) => {
    const base = { slug: str(l.slug), qty: Number(l.qty) || 0 }
    return typeof l.variant === "string" && l.variant
      ? { ...base, variant: l.variant }
      : { ...base, format: str(l.format), frame: str(l.frame) }
  })
}
