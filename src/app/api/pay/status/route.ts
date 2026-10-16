import { NextResponse, type NextRequest } from "next/server"
import { checkoutSessionStatus, gatewayEnv } from "../../../../lib/rapid-gateway"

/**
 * Where a payment has got to, asked of Rapid Gateway by the server.
 *
 *   GET /api/pay/status?session=cs_…
 *
 * For the screen only. The payment form says "success" in the browser, which
 * anybody can fake, so the confirmation page asks here before it says the
 * order is paid. What actually marks the order paid is the signed webhook
 * (/api/pay/webhook) — this never writes anything.
 */

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = request.nextUrl.searchParams.get("session") ?? ""
  if (!gatewayEnv() || !/^cs_[\w-]{8,100}$/.test(session)) {
    return NextResponse.json({ error: "Unknown payment." }, { status: 400 })
  }
  try {
    const { status } = await checkoutSessionStatus(session)
    return NextResponse.json({ status }, { headers: { "cache-control": "no-store" } })
  } catch (err) {
    console.error("Payment status check failed:", err)
    return NextResponse.json({ error: "Couldn't check the payment just now." }, { status: 502 })
  }
}
