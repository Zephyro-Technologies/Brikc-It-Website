import type { PaymentDetails } from "../data"

/**
 * wa.me rejects a local number — 03001234567 gives a dead link rather than an
 * error. The admin normalises on save; this repeats it on read so a number
 * stored before that, or edited straight in the database, still works.
 */
export function normaliseWhatsapp(input: string): string {
  const digits = input.replace(/\D/g, "")
  if (!digits) return ""
  if (digits.startsWith("00")) return digits.slice(2)
  if (digits.startsWith("0")) return `92${digits.slice(1)}`
  return digits
}

/** Where the checkout leaves the just-placed order for the confirmation page. */
export const CONFIRMATION_KEY = "brikc.order.v1"

export type PlacedOrder = {
  number: string
  total: number
  name: string
  /** What delivery cost, and what it was called. Zero for standard. */
  shipping: number
  deliveryLabel: string
  /**
   * What a coupon took off, as `place_order` worked it out — not as the
   * checkout was previewing it. Zero, with an empty code, when there was none.
   * Optional because an order placed before coupons existed can still be
   * sitting in sessionStorage when this page loads.
   */
  discount?: number
  coupon?: string
  /**
   * Set when the shopper chose to pay online. The email is what /api/pay asks
   * for to open the payment form again; `session` is the form opened at
   * checkout, absent if that failed; `paid` is remembered so a reload doesn't
   * ask for the money twice.
   */
  online?: {
    email: string
    session?: PaymentSession
    error?: string
    paid?: boolean
  }
}

/** What the embedded payment form needs — see src/lib/pay-online.ts. */
export type PaymentSession = {
  sessionId: string
  clientSecret: string
  publishableKey: string
  amount: number
  env: "LIVE" | "TEST"
}

/**
 * Online payment while Rapid Gateway is on its sandbox is for us, not for
 * shoppers: the checkout offers it only to a browser that has opened the shop
 * with ?pay=test, which remembers it for the visit.
 */
export const PAY_TEST_KEY = "brikc.pay.test"

/**
 * The message that opens in WhatsApp when a shopper taps through to send their
 * receipt. Pre-filling the order number is the whole point — it's the one
 * detail that turns a screenshot of a transfer into a matched payment.
 */
export function receiptLink(whatsapp: string, order: { number: string; total: number }): string {
  const text =
    `Hi! I've just placed order ${order.number} on brikc.it ` +
    `for Rs ${Math.round(order.total).toLocaleString("en-PK")}. ` +
    `Here's my transfer receipt:`
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`
}

export type PaymentAccount = { title: string; rows: [string, string][] }

/**
 * The accounts a shopper can pay into, in the order the confirmation page lists
 * them — and the payment email repeats them from here too, so the two can never
 * disagree about which accounts exist. A bank needs a title and something to pay
 * into before it is worth showing; a wallet needs a number.
 */
export function paymentAccounts(p: PaymentDetails): PaymentAccount[] {
  const accounts: PaymentAccount[] = []
  const { bank, jazzcash, easypaisa } = p

  if (bank.title && (bank.number || bank.iban)) {
    const rows: [string, string][] = [["Account title", bank.title]]
    if (bank.number) rows.push(["Account number", bank.number])
    if (bank.iban) rows.push(["IBAN", bank.iban])
    accounts.push({ title: bank.name || "Bank transfer", rows })
  }
  if (jazzcash.number) {
    accounts.push({ title: "JazzCash", rows: [["Account title", jazzcash.title], ["Number", jazzcash.number]] })
  }
  if (easypaisa.number) {
    accounts.push({ title: "Easypaisa", rows: [["Account title", easypaisa.title], ["Number", easypaisa.number]] })
  }
  return accounts
}
