import { money } from "./money"
import { firstName, type OrderEvent } from "./order-event"
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
 * The receipt for an order paid online: Rapid Gateway has confirmed the money,
 * so the order is confirmed and the build starts. Sent once, by the database,
 * when an online order first reaches paid (20261016120000 in the admin).
 *
 * Everything it says is what the shop then does — the same next steps the
 * confirmation page lists for an online order.
 */
export function paidEmail(order: OrderEvent, deliveryLabel: string): { subject: string; html: string; text: string } {
  const name = firstName(order.customer.name)
  const total = money(order.total)
  const handDelivered = order.method === "teamhq"
  const next = handDelivered
    ? "We arrange a time with you and bring it round in person."
    : "We send tracking once it ships."

  const subject = `Payment received — order ${order.number}`

  const text = [
    `${name ? `${name}, payment` : "Payment"} received — you're all set.`,
    "",
    `Order: ${order.number}`,
    `Paid: ${total}`,
    "",
    `Rapid Gateway has confirmed your payment of ${total} for order ${order.number}, so the order is confirmed and your build starts now.`,
    "",
    ...order.lines.map((l) => `${l.qty} × ${l.name}`),
    "",
    `Delivery: ${deliveryLabel}`,
    next,
    "",
    `Keep this reference: ${order.number}`,
  ].join("\n")

  const figure = (title: string, value: string, size: number, last: boolean) => `
            <tr><td style="padding:16px 20px;${last ? "" : `border-bottom:1px solid ${PANEL_LINE};`}">
              ${label(title, ON_DARK_MUTED)}
              <p style="margin:6px 0 0;font-family:${SLAB};font-size:${size}px;line-height:1.15;font-weight:800;color:#ffffff;white-space:nowrap;">${esc(value)}</p>
            </td></tr>`

  const items = card(`
            <tr><td style="padding:14px 14px;border-bottom:1px solid ${LINE};font-family:${SLAB};font-size:17px;font-weight:700;color:${INK};">What you ordered</td></tr>
            ${order.lines
              .map(
                (l, i) => `
            <tr><td style="padding:10px 14px;${i < order.lines.length - 1 ? `border-bottom:1px solid ${LINE};` : ""}font-family:${SANS};font-size:14px;line-height:1.5;color:${INK};">${esc(`${l.qty} × ${l.name}`)}</td></tr>`,
              )
              .join("")}`, "22px 0 0")

  const html = emailShell({
    subject,
    preheader: `${total} paid for order ${order.number}. Your build starts now.`,
    header: `${headline(`${name ? `${esc(name)}, payment` : "Payment"} received —`, "you&rsquo;re all set.")}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${PANEL}" style="margin:22px 0 0;background:${PANEL};border:1px solid ${PANEL_LINE};border-radius:18px;border-collapse:separate;">
          ${figure("Order", order.number, 24, false)}
          ${figure("Paid", total, 30, true)}
        </table>`,
    body: `${p(
      `Rapid Gateway has confirmed your payment of ${strong(total)} for order ${strong(order.number)}, so the ` +
        `order is confirmed and your build starts now.`,
    )}
        ${items}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="margin:14px 0 0;background:#ffffff;border:1px solid ${LINE};border-radius:20px;border-collapse:separate;box-shadow:${SHADOW};">
          <tr><td style="padding:16px 20px;">
            ${label("Delivery", MUTED)}
            <p style="margin:6px 0 0;font-family:${SANS};font-size:15px;line-height:1.6;color:${INK};">${esc(deliveryLabel)}</p>
            <p style="margin:4px 0 0;font-family:${SANS};font-size:14px;line-height:1.6;color:${MUTED};">${esc(next)}</p>
          </td></tr>
        </table>
        ${p(`Keep this reference: ${strong(order.number)}`, "margin-top:24px;font-size:14px;text-align:center;")}`,
    footer: `Sent because order ${esc(order.number)}, placed with ${siteLink} using this email address, was paid online.`,
  })

  return { subject, html, text }
}
