import { NextResponse } from "next/server"
import { supabase } from "../../../lib/supabase/client"
import { wireLines } from "../../../lib/order-lines"

/**
 * What a coupon code is worth against the cart in front of the shopper.
 *
 * It takes the cart, not a total. A subtotal sent from a browser is a price
 * crossing the wire, and the screen would then be showing a discount the shop
 * never agreed to — `quote_coupon` reprices every line from the catalogue with
 * the same function `place_order` uses, so the preview and the charge cannot
 * drift apart.
 *
 * It is also the only way a shopper can learn anything about a coupon: `anon`
 * has no select on the table, so codes can't be listed, only tried one at a
 * time.
 *
 * Nothing here is the last word. `place_order` runs the same check again when
 * the order is actually placed, because a code can expire, sell out or be
 * switched off between this call and the button.
 */

export const dynamic = "force-dynamic"

/** Our own validation failures, raised with errcode 22023, are safe to show. */
const USER_ERROR = "22023"

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "That request wasn't valid JSON." }, { status: 400 })
  }

  const code = typeof body.code === "string" ? body.code.trim() : ""
  if (!code) {
    return NextResponse.json({ error: "Enter a code first." }, { status: 400 })
  }

  const lines = wireLines(body)
  if (lines.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 })
  }

  const { data, error } = await supabase().rpc("quote_coupon", {
    p_code: code,
    p_lines: lines,
  })

  if (error) {
    // "That code has expired", "needs an order of at least Rs 50,000" — these
    // are written for the shopper and go straight back.
    if (error.code === USER_ERROR) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("quote_coupon failed", error)
    return NextResponse.json({ error: "We couldn't check that code just then." }, { status: 500 })
  }

  const result = data as { code?: string; discount?: number; subtotal?: number } | null
  if (!result?.code) {
    return NextResponse.json({ error: "That code is not one we recognise." }, { status: 400 })
  }

  return NextResponse.json({ code: result.code, discount: result.discount ?? 0 })
}
