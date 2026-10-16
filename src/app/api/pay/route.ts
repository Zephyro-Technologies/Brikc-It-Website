import { NextResponse } from "next/server"
import { PaymentRefused, startOnlinePayment } from "../../../lib/pay-online"
import { gatewayEnv } from "../../../lib/rapid-gateway"

/**
 * Opens the payment form again for an order already placed — "try again" after
 * a payment that failed or expired, or "pay online instead" from the transfer
 * instructions.
 *
 *   POST /api/pay   { "number": "BRK-1084", "email": "…" }
 *
 * The email has to be the one on the order (pay_online_start checks it), so an
 * order number found anywhere is not enough to start a payment on it.
 */

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  if (!gatewayEnv()) {
    return NextResponse.json({ error: "Online payment isn't available right now." }, { status: 503 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "That request wasn't valid JSON." }, { status: 400 })
  }
  const str = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 200) : "")

  try {
    return NextResponse.json(await startOnlinePayment(str(body.number), str(body.email)))
  } catch (err) {
    if (err instanceof PaymentRefused) return NextResponse.json({ error: err.message }, { status: 400 })
    console.error("Starting an online payment failed:", err)
    return NextResponse.json(
      { error: "Online payment couldn't be started just now. Please try again, or pay by transfer." },
      { status: 502 },
    )
  }
}
