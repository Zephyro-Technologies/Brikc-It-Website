/** Where the checkout leaves the just-placed order for the confirmation page. */
export const CONFIRMATION_KEY = "brikc.order.v1"

export type PlacedOrder = {
  number: string
  total: number
  name: string
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
