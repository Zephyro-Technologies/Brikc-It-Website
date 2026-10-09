import { NextResponse, type NextRequest } from "next/server"
import { sendOrderEmails } from "../../../lib/order-notifications"
import { readOrderEvent } from "../../../lib/order-event"

/**
 * Lets the database say an order needs its emails sent.
 *
 *   POST /api/emails
 *   x-revalidate-secret: <shared secret>
 *   { "kind": "placed", "number": "BRK-1083", "customer": {…}, "lines": […], … }
 *
 * Called by `private.send_order_email()` through pg_net: on a new order's first
 * status event, on the first move into delivered, and by the hourly reminder
 * job. The body carries everything the emails need, because this app holds only
 * the publishable key and cannot read an order.
 *
 * The same secret as /api/revalidate/changed, because the same two parties hold
 * it — Vault and this Worker — and a second one is a second thing to get out of
 * step. Fails closed, the same way: no secret configured, no emails sent by
 * anyone.
 *
 * It answers once Brevo has, not before, so the answer is the record:
 * net._http_response holds which emails went and why any didn't. Awaited rather
 * than run in after(), which also means a send can never be cut off when the
 * response goes.
 */

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET
  if (!expected) {
    return NextResponse.json({ error: "REVALIDATE_SECRET is not configured" }, { status: 503 })
  }
  if (request.headers.get("x-revalidate-secret") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "That request wasn't valid JSON." }, { status: 400 })
  }

  const order = readOrderEvent(body)
  if (!order) {
    return NextResponse.json({ error: "Expected an order event with a kind and a number." }, { status: 400 })
  }

  const sent = await sendOrderEmails(order)
  const failed = Object.values(sent).some((o) => o !== "skipped" && !o.ok)
  return NextResponse.json({ number: order.number, kind: order.kind, sent }, { status: failed ? 502 : 200 })
}
