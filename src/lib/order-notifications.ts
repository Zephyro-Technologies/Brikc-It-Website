import { money } from "./money"
import { describe, sendEmail, type Outcome } from "./brevo"
import { ownerOrderEmail } from "./owner-order-email"
import { paymentEmail } from "./payment-email"
import { reviewEmail } from "./review-email"
import type { OrderEvent } from "./order-event"
import { getDeliveryOptions, getPaymentDetails } from "./shop"

/**
 * Every email an order sends, worked out from what the database says happened
 * to it. The database decides when — a new order's first status event, the
 * first move into delivered, two days after that — and posts it to /api/emails;
 * see `20261009120000_orders_send_their_own_emails.sql` in the admin repo. This
 * decides what goes and to whom.
 *
 *   placed           the payment details to the customer, then the new-order
 *                    alert to the owners, carrying whether the first one went
 *   review           a request to review each build in the order
 *   review_reminder  the same, once more, if no review has come in
 *
 * At most once. The database marks each kind sent before asking, and nothing
 * here retries: a second payment email is worse than a missing one, and the
 * confirmation page has already shown the same details.
 *
 * It never throws. Every outcome comes back so the route can answer with it,
 * and that answer is what lands in net._http_response.
 */

export type Sent = Record<string, Outcome | "skipped">

export async function sendOrderEmails(order: OrderEvent): Promise<Sent> {
  if (order.kind === "placed") return placed(order)

  const to = order.customer.email
  if (!to || order.builds.length === 0) return { [order.kind]: "skipped" }

  let email: ReturnType<typeof reviewEmail>
  try {
    email = reviewEmail(order, order.kind === "review_reminder")
  } catch (err) {
    return { [order.kind]: { ok: false, reason: `couldn't build the email (${describe(err)})` } }
  }
  const outcome = await sendEmail({
    to: [{ email: to, name: order.customer.name }],
    ...email,
    tag: order.kind === "review" ? "review-request" : "review-reminder",
  })
  if (!outcome.ok) console.error(`Review email (${order.kind}) for ${order.number} not sent: ${outcome.reason}`)
  return { [order.kind]: outcome }
}

async function placed(order: OrderEvent): Promise<Sent> {
  let deliveryLabel = order.method === "teamhq" ? "Hand delivery by TEAM HQ" : "Standard delivery"
  let payment: Outcome | "skipped" = "skipped"

  try {
    const [details, options] = await Promise.all([getPaymentDetails(), getDeliveryOptions()])
    // The live label when the method is still offered. A manual order can be
    // for hand delivery after the towns were cleared, and keeps its own name.
    deliveryLabel = options.find((o) => o.id === order.method)?.label ?? deliveryLabel

    if (order.paymentEmail && order.customer.email) {
      payment = await sendPayment(order, deliveryLabel, details)
    }
  } catch (err) {
    // Both reads are of the settings row; the detail names which one failed.
    if (order.paymentEmail) payment = { ok: false, reason: `couldn't read the shop's settings (${describe(err)})` }
  }

  if (payment !== "skipped" && !payment.ok) {
    console.error(`Payment email for ${order.number} not sent: ${payment.reason}`)
  }

  const [owners] = await Promise.all([
    alertOwnersByEmail(order, deliveryLabel, payment),
    pushOwners(order, deliveryLabel, payment),
  ])
  return { payment, owners }
}

async function sendPayment(
  order: OrderEvent,
  deliveryLabel: string,
  details: Awaited<ReturnType<typeof getPaymentDetails>>,
): Promise<Outcome> {
  let email: ReturnType<typeof paymentEmail>
  try {
    email = paymentEmail(
      {
        number: order.number,
        total: order.total,
        name: order.customer.name,
        shipping: order.shipping,
        deliveryLabel,
        discount: order.discount,
        coupon: order.coupon,
        method: order.method,
      },
      details,
    )
  } catch (err) {
    return { ok: false, reason: `couldn't build the email (${describe(err)})` }
  }
  return sendEmail({
    to: [{ email: order.customer.email, name: order.customer.name }],
    ...email,
    tag: "payment-details",
  })
}

async function alertOwnersByEmail(
  order: OrderEvent,
  deliveryLabel: string,
  payment: Outcome | "skipped",
): Promise<Outcome | "skipped"> {
  const to = order.alertTo
    .split(",")
    .map((a) => a.trim())
    .filter((a) => a.includes("@"))
  if (to.length === 0) return "skipped"

  let email: ReturnType<typeof ownerOrderEmail>
  try {
    email = ownerOrderEmail(order, deliveryLabel, payment)
  } catch (err) {
    return { ok: false, reason: `couldn't build the email (${describe(err)})` }
  }
  const outcome = await sendEmail({
    to: to.map((email) => ({ email })),
    ...email,
    tag: "new-order",
    // A reply goes to the customer, which is the reply an owner reading about a
    // new order means to send. Only to an address shaped like one: Brevo refuses
    // the whole email over a bad reply-to, and this alert must not depend on what
    // somebody typed into the order.
    ...(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(order.customer.email) && {
      replyTo: { email: order.customer.email, name: order.customer.name },
    }),
  })
  if (!outcome.ok) console.error(`New-order email for ${order.number} not sent: ${outcome.reason}`)
  return outcome
}

/**
 * The owners' push, through a Pushover delivery group. Built, and paused until
 * the owners approve it: off until both keys are set. Setting them sends the
 * customer's name, city and email to Pushover, which /privacy
 * (src/app/privacy/page.tsx) doesn't list yet — name it there in the same change
 * that turns this on.
 */
async function pushOwners(order: OrderEvent, deliveryLabel: string, payment: Outcome | "skipped"): Promise<void> {
  const token = process.env.PUSHOVER_APP_TOKEN
  // A delivery group's key, so owners are added and removed on pushover.net
  // rather than here. A single person's user key works the same way.
  const user = process.env.PUSHOVER_GROUP_KEY
  if (!token || !user) return

  const items = order.lines.reduce((n, l) => n + l.qty, 0)
  const lines = [
    [order.customer.name, order.address.city].filter(Boolean).join(" · "),
    `${items} ${items === 1 ? "item" : "items"} · ${deliveryLabel}`,
    ...(order.discount > 0 ? [`${order.coupon} took off ${money(order.discount)}`] : []),
    payment === "skipped"
      ? "No payment email"
      : payment.ok
        ? `Payment email sent to ${order.customer.email}`
        : `Payment email NOT sent — ${payment.reason}`,
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
        url: `https://admin.brikc.it/orders/${encodeURIComponent(order.number)}`,
        url_title: "Open in admin",
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { errors?: string[] } | null
      console.error(`Pushover ${res.status} for ${order.number}: ${body?.errors?.join("; ") ?? "no detail"}`)
    }
  } catch (err) {
    console.error(`Pushover unreachable for ${order.number}: ${describe(err)}`)
  }
}
