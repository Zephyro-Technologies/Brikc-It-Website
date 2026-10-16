import "server-only"
import { createCheckoutSession, GatewayError, gatewayEnv, mayPayOnline, type GatewayEnv } from "./rapid-gateway"
import { serviceSupabase } from "./supabase/service"

/** What the browser needs to show the payment form, and nothing more. */
export type OnlinePayment = {
  number: string
  sessionId: string
  clientSecret: string
  publishableKey: string
  amount: number
  env: GatewayEnv
}

/** A refusal written for the shopper (errcode 22023 from the database), or null for a fault of ours. */
export class PaymentRefused extends Error {}

/**
 * Opens an embedded-checkout session for an order that is waiting for payment.
 *
 * The order number alone is not enough: pay_online_start checks the email
 * against it, so knowing somebody's order number does not let anyone start a
 * payment on it. The amount comes from the order the database priced, never
 * from the browser. Called by /api/orders straight after placing an order
 * online, and by /api/pay when somebody tries again.
 */
export async function startOnlinePayment(number: string, email: string): Promise<OnlinePayment> {
  const env = gatewayEnv()
  if (!env) throw new GatewayError("online payment is off")
  if (!mayPayOnline(email)) {
    throw new PaymentRefused("Online payment is still being tested. Please pay by bank transfer for now.")
  }

  const db = serviceSupabase()
  const { data, error } = await db.rpc("pay_online_start", { p_number: number, p_email: email })
  if (error) {
    if (error.code === "22023") throw new PaymentRefused(error.message)
    throw new Error(`pay_online_start failed: ${error.message}`)
  }
  const order = data as { number: string; basketId: string; total: number; email: string; phone: string }

  const session = await createCheckoutSession(order)

  // Kept on the order for support — the session a payment was attempted in.
  // Not needed to settle it: the webhook matches on the basket.
  const { error: attachError } = await db.rpc("attach_payment_session", {
    p_basket_id: order.basketId,
    p_session_id: session.sessionId,
  })
  if (attachError) console.error(`attach_payment_session for ${order.number}: ${attachError.message}`)

  return {
    number: order.number,
    sessionId: session.sessionId,
    clientSecret: session.clientSecret,
    publishableKey: session.publishableKey,
    amount: order.total,
    env,
  }
}
