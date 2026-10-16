import { NextResponse } from "next/server"
import { gatewayEnv, mayPayOnline, verifyWebhook } from "../../../../lib/rapid-gateway"
import { serviceSupabase } from "../../../../lib/supabase/service"

/**
 * Rapid Gateway telling the shop how a payment ended. This, and only this,
 * marks an order paid — the shopper landing back on the page proves nothing,
 * because a payment still waiting on wallet approval lands there too.
 *
 * Registered in their portal under Settings → Webhooks, once for LIVE and once
 * for TEST, each with its own signing secret (RAPID_WEBHOOK_SECRET).
 *
 * settle_payment in Postgres does the deciding: it ignores an eventId it has
 * seen, matches the order on BASKET_ID (their merchantTransactionId), refuses
 * an amount that isn't the order total, and only ever moves an order from
 * pending_payment to paid. Paid then moves the stock, counts the coupon, tells
 * Meta and sends the receipt, as it does when an owner marks it paid.
 *
 * Answers 2xx for anything it has dealt with or chosen to ignore, so Rapid
 * Gateway doesn't retry it, and 401 for anything not signed with our secret.
 * A 500 is the one answer that asks for a retry — they try again at 30s, 2m,
 * 10m, 1h and 6h.
 */

export const dynamic = "force-dynamic"

type Payment = {
  eventId?: string
  eventType?: string
  merchantTransactionId?: string
  status?: string
  amount?: number
  gatewayTxnRef?: string
  environment?: string
}

export async function POST(request: Request) {
  // The exact bytes that were signed. Parsed only after they check out.
  const raw = await request.text()
  const ok = await verifyWebhook(
    raw,
    request.headers.get("x-rapidgateway-timestamp") ?? "",
    request.headers.get("x-rapidgateway-signature") ?? "",
  )
  if (!ok) return NextResponse.json({ error: "Bad signature" }, { status: 401 })

  let event: Payment
  try {
    event = JSON.parse(raw) as Payment
  } catch {
    return NextResponse.json({ error: "Not JSON" }, { status: 400 })
  }

  const kind = event.eventType ?? ""
  // Refunds, reversals and payouts are recorded in their portal; nothing here
  // acts on them yet.
  if (kind !== "transaction.completed" && kind !== "transaction.failed") {
    return NextResponse.json({ ignored: kind })
  }

  // A sandbox payment must never mark a real order paid, and the other way
  // round. Their secrets are per environment too, so this is the second lock.
  const env = gatewayEnv()
  if (!env || (event.environment && event.environment.toUpperCase() !== env)) {
    return NextResponse.json({ ignored: `environment ${event.environment ?? "?"}` })
  }

  if (!event.eventId || !event.merchantTransactionId) {
    return NextResponse.json({ error: "Missing eventId or merchantTransactionId" }, { status: 400 })
  }

  const db = serviceSupabase()

  // On the sandbox a payment is play money, and anybody can make one with the
  // login Rapid Gateway publishes. So it settles a tester's order and nothing
  // else — the same list /api/orders and /api/pay check (mayPayOnline).
  if (env === "TEST") {
    const { data: order } = await db
      .from("orders")
      .select("customer_email")
      .eq("basket_id", event.merchantTransactionId)
      .maybeSingle()
    if (!order || !mayPayOnline(order.customer_email ?? "")) {
      return NextResponse.json({ ignored: "not a tester's order" })
    }
  }

  const { data, error } = await db.rpc("settle_payment", {
    p_event_id: event.eventId,
    p_event_type: kind,
    p_basket_id: event.merchantTransactionId,
    p_status: (event.status ?? (kind === "transaction.completed" ? "SUCCESS" : "FAILED")).toUpperCase(),
    p_amount: typeof event.amount === "number" ? event.amount : 0,
    p_gateway_ref: event.gatewayTxnRef ?? "",
  })
  if (error) {
    console.error(`settle_payment for ${event.merchantTransactionId}:`, error)
    return NextResponse.json({ error: "Couldn't record it" }, { status: 500 })
  }

  const outcome = (data as { outcome?: string } | null)?.outcome ?? "unknown"
  if (outcome !== "paid" && outcome !== "duplicate" && outcome !== "not_successful") {
    console.error(`Payment webhook for ${event.merchantTransactionId}: ${outcome}`)
  }
  return NextResponse.json({ outcome })
}
