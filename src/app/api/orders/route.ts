import { after, NextResponse } from "next/server"
import { supabase } from "../../../lib/supabase/client"
import { wireLines } from "../../../lib/order-lines"
import { announceOrder } from "../../../lib/order-notifications"

/**
 * Takes an order from the checkout form.
 *
 * Deliberately thin. It shapes the request and hands everything to the
 * `place_order` function in Postgres, which is where the real work happens:
 * validating the fields, checking each build is in the catalogue, in stock and
 * sold in the format asked for, and — the point of the exercise — pricing every
 * line from the database rather than trusting a number from the browser.
 *
 * So this route never sees a price and never computes a total. If it did, that
 * would be one more place a total could be wrong.
 *
 * Once the order is in, the payment email and the owners' push go out from
 * `announceOrder`, after the response — see src/lib/order-notifications.ts.
 */

/** Our own validation failures, raised with errcode 22023, are safe to show. */
const USER_ERROR = "22023"

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "That request wasn't valid JSON." }, { status: 400 })
  }

  const str = (v: unknown) => (typeof v === "string" ? v : "")
  const customer = (body.customer ?? {}) as Record<string, unknown>
  const address = (body.address ?? {}) as Record<string, unknown>
  // Shaped by the same function /api/coupon uses, so the cart a discount was
  // quoted against is the cart that gets priced here.
  const lines = wireLines(body)

  if (lines.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 })
  }

  const { data, error } = await supabase().rpc("place_order", {
    p_name: str(customer.name),
    p_email: str(customer.email),
    p_phone: str(customer.phone),
    p_line1: str(address.line1),
    p_line2: str(address.line2),
    p_city: str(address.city),
    p_province: str(address.province),
    p_postcode: str(address.postcode),
    p_lines: lines,
    // Which method is legitimate, and what it costs, is decided in the
    // database — this only carries the choice across.
    p_shipping_method: str(body.shippingMethod) || "standard",
    // The code, never the discount. place_order runs the same check the
    // preview ran and works the amount out again, so a code that expired
    // while the form was open is caught here rather than honoured.
    p_coupon: str(body.coupon),
  })

  if (error) {
    // A validation message is written for the shopper and goes straight back.
    // Anything else is a fault on our side and shouldn't leak its internals.
    if (error.code === USER_ERROR) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("place_order failed", error)
    return NextResponse.json(
      { error: "We couldn't place that order. Please try again, or message us and we'll sort it." },
      { status: 500 },
    )
  }

  const result = data as {
    number?: string
    total?: number
    shipping?: number
    discount?: number
    coupon?: string
  } | null
  if (!result?.number) {
    console.error("place_order returned nothing usable", data)
    return NextResponse.json({ error: "We couldn't place that order." }, { status: 500 })
  }

  const placed = {
    number: result.number,
    total: result.total ?? 0,
    shipping: result.shipping ?? 0,
    discount: result.discount ?? 0,
    coupon: result.coupon ?? "",
  }

  // The payment email and the owners' push. after() keeps the Worker alive until
  // they finish without holding the shopper's response for them, and the order
  // is already committed — nothing in there can undo it.
  after(() =>
    announceOrder({
      ...placed,
      name: str(customer.name).trim(),
      // Trimmed and lowercased, as place_order stored and validated it.
      email: str(customer.email).trim().toLowerCase(),
      city: str(address.city).trim(),
      items: lines.reduce((n, l) => n + l.qty, 0),
      // Normalised the way place_order resolves it — lower(btrim(...)) — so the
      // label on the email and the push is the method that was charged.
      method: str(body.shippingMethod).trim().toLowerCase() === "teamhq" ? "teamhq" : "standard",
    }),
  )

  return NextResponse.json(placed)
}
