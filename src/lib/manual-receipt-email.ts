import { money } from "./money"
import { eventLineLabel, firstName, type OrderEvent } from "./order-event"
import {
  INK,
  LINE,
  MUTED,
  ON_DARK_MUTED,
  PANEL,
  PANEL_LINE,
  SANS,
  SHADOW,
  SLAB,
  card,
  emailShell,
  esc,
  headline,
  label,
  p,
  siteLink,
  strong,
} from "./email-layout"

/**
 * The receipt for an order an owner wrote up in the admin as already paid —
 * paid by transfer or in cash, outside the site, before it was entered. It is
 * the "paid" kind with `enteredPaid` set, and it goes instead of the payment
 * details, never as well: the customer has nothing left to pay, so an email
 * listing bank accounts and asking for a transfer would be the wrong thing to
 * receive. The database decides that (`20261030160000_a_manual_order_can_arrive_paid.sql`
 * in the admin); this decides what it says.
 *
 * Kept apart from paid-email.ts, the online receipt, on purpose. That one says
 * Rapid Gateway confirmed the payment, which here would be untrue — nothing on
 * the site took this money — so this one never says how it was paid, only that
 * it was received. And it carries the delivery address, which the online
 * receipt doesn't need because the shopper typed it into the checkout a minute
 * before: somebody whose order was taken over WhatsApp has never seen it
 * written down, and this is where they can check it.
 *
 * Nothing about when the build starts or when it arrives: a hand-entered order
 * may already be built, and nothing on the order says when it will reach them.
 * What it does promise is what the shop then does — tracking when it ships, or
 * TEAM HQ arranging a time.
 */
export function manualReceiptEmail(
  order: OrderEvent,
  deliveryLabel: string,
): { subject: string; html: string; text: string } {
  const name = firstName(order.customer.name)
  const total = money(order.total)
  const handDelivered = order.method === "teamhq"
  const next = handDelivered
    ? "We arrange a time with you and bring it round in person."
    : "We send tracking once it ships."

  const notes: string[] = []
  // A hand-entered order can carry a discount with no code behind it.
  if (order.discount > 0) {
    notes.push(order.coupon ? `${order.coupon} took off ${money(order.discount)}` : `After ${money(order.discount)} off`)
  }
  if (order.shipping > 0) notes.push(`Includes ${money(order.shipping)} for ${deliveryLabel.toLowerCase()}`)

  const subject = `Order ${order.number} confirmed — payment received`

  // Written once and drawn twice, as shipped-email.ts does: `ref` sets a number
  // somebody might type, so the HTML escapes it and the plain text keeps it.
  const opening = (ref: (s: string) => string) =>
    `We’ve received your payment of ${ref(total)} for order ${ref(order.number)}, so your order is confirmed. ` +
    `There’s nothing more to pay.`
  const asTyped = (s: string) => s

  const address = [
    order.customer.name,
    order.address.line1,
    order.address.line2,
    [order.address.city, order.address.province].filter(Boolean).join(", "),
    order.address.postcode,
  ].filter((s) => s.trim())

  const lines = order.lines.map((l) => ({ title: `${l.qty} × ${l.name}`, detail: eventLineLabel(l) }))

  // ── Plain text ───────────────────────────────────────────────────────────
  const text = [
    `${name ? `${name}, your` : "Your"} order is confirmed.`,
    "",
    `Order: ${order.number}`,
    `Paid: ${total}`,
    ...notes,
    "",
    opening(asTyped),
    "",
    "What you ordered:",
    ...lines.map((l) => `${l.title}${l.detail ? ` (${l.detail})` : ""}`),
    "",
    `Delivery: ${deliveryLabel}`,
    next,
    ...(address.length ? ["", "Delivering to:", ...address] : []),
    "",
    "Anything not right? Reply to this email.",
    "",
    `Keep this reference: ${order.number}`,
  ].join("\n")

  // ── HTML ─────────────────────────────────────────────────────────────────
  const figure = (title: string, value: string, size: number, extra: string[], last: boolean) => `
            <tr><td style="padding:16px 20px;${last ? "" : `border-bottom:1px solid ${PANEL_LINE};`}">
              ${label(title, ON_DARK_MUTED)}
              <p style="margin:6px 0 0;font-family:${SLAB};font-size:${size}px;line-height:1.15;font-weight:800;color:#ffffff;white-space:nowrap;">${esc(value)}</p>
              ${extra
                .map((n) => `<p style="margin:6px 0 0;font-family:${SANS};font-size:13px;line-height:1.4;color:${ON_DARK_MUTED};">${esc(n)}</p>`)
                .join("")}
            </td></tr>`

  const heading = (s: string) =>
    `<tr><td style="padding:14px 14px;border-bottom:1px solid ${LINE};font-family:${SLAB};font-size:17px;font-weight:700;color:${INK};">${esc(s)}</td></tr>`

  const items = card(`
            ${heading("What you ordered")}
            ${lines
              .map(
                (l, i) => `
            <tr><td style="padding:10px 14px;${i < lines.length - 1 ? `border-bottom:1px solid ${LINE};` : ""}font-family:${SANS};font-size:14px;line-height:1.5;color:${INK};">${esc(l.title)}${
                  l.detail ? `<br><span style="font-size:13px;color:${MUTED};">${esc(l.detail)}</span>` : ""
                }</td></tr>`,
              )
              .join("")}`, "22px 0 0")

  const delivery = `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="margin:14px 0 0;background:#ffffff;border:1px solid ${LINE};border-radius:20px;border-collapse:separate;box-shadow:${SHADOW};">
          <tr><td style="padding:16px 20px;">
            ${label("Delivery", MUTED)}
            <p style="margin:6px 0 0;font-family:${SANS};font-size:15px;line-height:1.6;color:${INK};">${esc(deliveryLabel)}</p>
            <p style="margin:4px 0 0;font-family:${SANS};font-size:14px;line-height:1.6;color:${MUTED};">${esc(next)}</p>
          </td></tr>
        </table>`

  const destination = address.length
    ? card(`
            ${heading("Delivering to")}
            <tr><td style="padding:12px 14px;font-family:${SANS};font-size:14px;line-height:1.6;color:${INK};">${address.map(esc).join("<br>")}</td></tr>`, "14px 0 0")
    : ""

  const html = emailShell({
    subject,
    preheader: `${total} received for order ${order.number}. Your order is confirmed.`,
    header: `${headline(`${name ? `${esc(name)}, your` : "Your"} order is`, "confirmed.")}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${PANEL}" style="margin:22px 0 0;background:${PANEL};border:1px solid ${PANEL_LINE};border-radius:18px;border-collapse:separate;">
          ${figure("Order", order.number, 24, [], false)}
          ${figure("Paid", total, 30, notes, true)}
        </table>`,
    body: `${p(opening(strong))}
        ${items}
        ${delivery}
        ${destination}
        ${p("Anything not right? Reply to this email.", "margin-top:24px;font-size:14px;text-align:center;")}
        ${p(`Keep this reference: ${strong(order.number)}`, "margin-top:8px;font-size:14px;text-align:center;")}`,
    footer: `Sent because order ${esc(order.number)}, placed with ${siteLink} using this email address, was paid.`,
  })

  return { subject, html, text }
}
