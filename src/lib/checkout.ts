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
}

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
