import type { PaymentDetails, ShippingMethod } from "../data"
import type { PlacedOrder } from "./checkout"
import { money } from "./money"
import { paymentEmail } from "./payment-email"
import { getDeliveryOptions, getPaymentDetails } from "./shop"

/**
 * What happens once an order is placed on the site: the shopper is emailed the
 * payment details, and the two owners get a push on their phones.
 *
 * Runs inside after() in /api/orders, so neither the shopper nor the order waits
 * on Brevo or Pushover — the order is committed before this starts and nothing
 * here can undo it. It never throws.
 *
 * At most once. Nothing retries, because a second payment email is worse than a
 * missing one: the confirmation page has already put the same details on screen.
 *
 * The push carries the email's outcome. This app holds only the public key and
 * cannot write a note onto the order, so the owners' phones are the record —
 * "Payment email NOT sent" there is how anybody finds out.
 *
 * Every key is optional, and a missing one turns its half off. That is what local
 * development wants: a test order never emails a real address.
 */

export type NewOrder = Omit<PlacedOrder, "deliveryLabel"> & {
  email: string
  city: string
  /** Units across every line — a bundle counts once. */
  items: number
  method: ShippingMethod
}

/**
 * The address authenticated with Brevo as brikc.it's sending domain; Brevo
 * refuses a sender on a domain it hasn't verified. Replies land here too, and
 * Cloudflare Email Routing forwards them to an owner's inbox.
 */
const SENDER = { name: "brikc.it", email: "orders@brikc.it" }

/** Where a tap on the push lands. The admin looks an order up by its number as well as its id. */
const ADMIN_ORDER = "https://admin.brikc.it/orders/"

/** Well inside the time a Worker is kept alive after responding. */
const TIMEOUT_MS = 10_000

type Outcome = { ok: true } | { ok: false; reason: string }

const describe = (err: unknown) => (err instanceof Error ? err.message : String(err))

export async function announceOrder(order: NewOrder): Promise<void> {
  let deliveryLabel = "Standard delivery"
  let email: Outcome

  try {
    const [payment, options] = await Promise.all([getPaymentDetails(), getDeliveryOptions()])
    deliveryLabel = options.find((o) => o.id === order.method)?.label ?? deliveryLabel
    email = await sendPaymentEmail({ ...order, deliveryLabel }, payment)
  } catch (err) {
    // Both reads are of the settings row; the detail names which one failed.
    email = { ok: false, reason: `couldn't read the shop's settings (${describe(err)})` }
  }

  if (!email.ok) console.error(`Payment email for ${order.number} not sent: ${email.reason}`)
  await alertOwners(order, deliveryLabel, email)
}

async function sendPaymentEmail(order: PlacedOrder & { email: string }, payment: PaymentDetails): Promise<Outcome> {
  const key = process.env.BREVO_API_KEY
  if (!key) return { ok: false, reason: "BREVO_API_KEY is not set" }

  let email: ReturnType<typeof paymentEmail>
  try {
    email = paymentEmail(order, payment)
  } catch (err) {
    return { ok: false, reason: `couldn't build the email (${describe(err)})` }
  }
  const { subject, html, text } = email

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: SENDER,
        replyTo: SENDER,
        // Brevo refuses a display name over 70 characters, and checkout allows
        // 120. The name is cosmetic here — the greeting is in the body — so a
        // long one is left off rather than cut mid-word.
        to: [{ email: order.email, ...(order.name.length <= 70 && { name: order.name }) }],
        subject,
        htmlContent: html,
        textContent: text,
        tags: ["payment-details"],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (res.ok) return { ok: true }

    const body = (await res.json().catch(() => null)) as { message?: string } | null
    return { ok: false, reason: `Brevo ${res.status}${body?.message ? `: ${body.message}` : ""}` }
  } catch (err) {
    return { ok: false, reason: `Brevo unreachable (${describe(err)})` }
  }
}

async function alertOwners(order: NewOrder, deliveryLabel: string, email: Outcome): Promise<void> {
  const token = process.env.PUSHOVER_APP_TOKEN
  // A delivery group's key, so owners are added and removed on pushover.net
  // rather than here. A single person's user key works the same way.
  const user = process.env.PUSHOVER_GROUP_KEY
  if (!token || !user) return

  const discount = order.discount ?? 0
  const lines = [
    [order.name, order.city].filter(Boolean).join(" · "),
    `${order.items} ${order.items === 1 ? "item" : "items"} · ${deliveryLabel}`,
    ...(discount > 0 ? [`${order.coupon} took off ${money(discount)}`] : []),
    email.ok ? `Payment email sent to ${order.email}` : `Payment email NOT sent — ${email.reason}`,
  ]

  try {
    const res = await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      body: new URLSearchParams({
        token,
        user,
        title: `New order ${order.number} · ${money(order.total)}`,
        message: lines.join("\n").slice(0, 1024),
        // High, not normal: an order sounds at any hour, through quiet hours.
        priority: "1",
        url: ADMIN_ORDER + encodeURIComponent(order.number),
        url_title: "Open in admin",
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { errors?: string[] } | null
      console.error(`Pushover ${res.status} for ${order.number}: ${body?.errors?.join("; ") ?? "no detail"}`)
    }
  } catch (err) {
    console.error(`Pushover unreachable for ${order.number}: ${describe(err)}`)
  }
}
