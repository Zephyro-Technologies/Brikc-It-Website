import { NextResponse } from "next/server"
import { supabase } from "../../../lib/supabase/client"

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
 */

type IncomingLine = { slug?: unknown; format?: unknown; qty?: unknown }

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
  const rawLines = Array.isArray(body.lines) ? (body.lines as IncomingLine[]) : []

  if (rawLines.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 })
  }

  // Only slug, format and quantity cross the wire. Anything else the client
  // might have sent about a line — a name, an image, a price — is dropped here.
  const lines = rawLines.slice(0, 20).map((l) => ({
    slug: str(l.slug),
    format: str(l.format),
    qty: Number(l.qty) || 0,
  }))

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

  const result = data as { number?: string; total?: number } | null
  if (!result?.number) {
    console.error("place_order returned nothing usable", data)
    return NextResponse.json({ error: "We couldn't place that order." }, { status: 500 })
  }

  return NextResponse.json({ number: result.number, total: result.total ?? 0 })
}
