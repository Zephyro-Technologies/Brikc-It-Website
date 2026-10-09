import { money } from "./money"
import type { Outcome } from "./brevo"
import { eventLineLabel, type OrderEvent } from "./order-event"
import {
  INK,
  LINE,
  MUTED,
  ON_DARK_MUTED,
  PANEL,
  PANEL_LINE,
  SANS,
  SLAB,
  button,
  card,
  emailShell,
  esc,
  headline,
  label,
  p,
} from "./email-layout"

/**
 * The owners' copy of a new order: who, what, where to, and whether the
 * customer's payment email went. Site orders and manual ones alike.
 *
 * It carries the payment email's outcome because nothing else would: this app
 * cannot write a note onto the order, so "Payment email NOT sent — Brevo 401"
 * in an owner's inbox is how anybody finds out.
 */

/** Where the button lands. The admin looks an order up by its number as well as its id. */
const ADMIN_ORDER = "https://admin.brikc.it/orders/"

export function ownerOrderEmail(
  order: OrderEvent,
  deliveryLabel: string,
  payment: Outcome | "skipped",
): { subject: string; html: string; text: string } {
  const total = money(order.total)
  const where = order.source === "manual" ? "Entered in the admin" : "Placed on the site"
  const items = order.lines.reduce((n, l) => n + l.qty, 0)
  const admin = ADMIN_ORDER + encodeURIComponent(order.number)

  const paymentLine =
    payment === "skipped"
      ? order.paymentEmail
        ? "No payment email sent."
        : "No payment email: the order is dated more than a day ago, or has no valid email address."
      : payment.ok
        ? `Payment email sent to ${order.customer.email}.`
        : `Payment email NOT sent — ${payment.reason}`

  const address = [
    order.address.line1,
    order.address.line2,
    [order.address.city, order.address.province].filter(Boolean).join(", "),
    order.address.postcode,
  ].filter((s) => s.trim())

  const lines = order.lines.map((l) => ({
    title: `${l.qty} × ${l.name}`,
    detail: eventLineLabel(l),
    price: money(l.unitPrice * l.qty),
  }))

  const sums: [string, string][] = [
    ["Subtotal", money(order.subtotal)],
    ...(order.discount > 0 ? [[`Coupon ${order.coupon}`, `− ${money(order.discount)}`] as [string, string]] : []),
    [deliveryLabel, order.shipping > 0 ? money(order.shipping) : "Free"],
    ["Total", total],
  ]

  const subject = `New order ${order.number} · ${total} — ${order.customer.name || "no name"}`

  // ── Plain text ───────────────────────────────────────────────────────────
  const text = [
    `New order ${order.number} · ${total}`,
    `${where} · ${items} ${items === 1 ? "item" : "items"}`,
    "",
    paymentLine,
    "",
    order.customer.name,
    order.customer.email,
    order.customer.phone,
    ...address,
    "",
    ...lines.map((l) => `${l.title}${l.detail ? ` (${l.detail})` : ""} — ${l.price}`),
    "",
    ...sums.map(([k, v]) => `${k}: ${v}`),
    "",
    `Open in admin: ${admin}`,
  ].join("\n")

  // ── HTML ─────────────────────────────────────────────────────────────────
  const row = (left: string, right: string, last: boolean, bold = false) => `
            <tr>
              <td style="padding:10px 14px;${last ? "" : `border-bottom:1px solid ${LINE};`}font-family:${SANS};font-size:14px;line-height:1.5;color:${bold ? INK : MUTED};${bold ? "font-weight:700;" : ""}">${left}</td>
              <td align="right" style="padding:10px 14px;${last ? "" : `border-bottom:1px solid ${LINE};`}font-family:${SANS};font-size:14px;line-height:1.5;color:${INK};white-space:nowrap;${bold ? "font-weight:700;" : ""}">${esc(right)}</td>
            </tr>`

  const heading = (s: string) =>
    `<tr><td colspan="2" style="padding:14px 14px;border-bottom:1px solid ${LINE};font-family:${SLAB};font-size:17px;font-weight:700;color:${INK};">${esc(s)}</td></tr>`

  const customer = card(`
            ${heading("Customer")}
            <tr><td colspan="2" style="padding:12px 14px;font-family:${SANS};font-size:15px;line-height:1.6;color:${INK};">
              <strong>${esc(order.customer.name)}</strong><br>
              ${esc(order.customer.email)}<br>
              ${esc(order.customer.phone)}
              ${address.length ? `<p style="margin:10px 0 0;font-family:${SANS};font-size:14px;line-height:1.6;color:${MUTED};">${address.map(esc).join("<br>")}</p>` : ""}
            </td></tr>`)

  const goods = card(`
            ${heading("Items")}
            ${lines
              .map((l) =>
                row(
                  `<span style="color:${INK};font-weight:600;">${esc(l.title)}</span>${
                    l.detail ? `<br><span style="font-size:13px;">${esc(l.detail)}</span>` : ""
                  }`,
                  l.price,
                  false,
                ),
              )
              .join("")}
            ${sums.map(([k, v], i) => row(esc(k), v, i === sums.length - 1, i === sums.length - 1)).join("")}`)

  const failed = payment !== "skipped" && !payment.ok

  const html = emailShell({
    subject,
    preheader: `${order.customer.name} · ${items} ${items === 1 ? "item" : "items"} · ${where.toLowerCase()}`,
    header: `${headline("New order", esc(order.number))}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${PANEL}" style="margin:22px 0 0;background:${PANEL};border:1px solid ${PANEL_LINE};border-radius:18px;border-collapse:separate;">
          <tr><td style="padding:16px 20px;">
            ${label("Total", ON_DARK_MUTED)}
            <p style="margin:6px 0 0;font-family:${SLAB};font-size:30px;line-height:1.15;font-weight:800;color:#ffffff;white-space:nowrap;">${esc(total)}</p>
            <p style="margin:6px 0 0;font-family:${SANS};font-size:13px;line-height:1.4;color:${ON_DARK_MUTED};">${esc(where)} · ${items} ${items === 1 ? "item" : "items"}</p>
          </td></tr>
        </table>`,
    body: `${p(esc(paymentLine), `margin:0 0 18px;font-size:14px;${failed ? "color:#b81022;font-weight:700;" : ""}`)}
        ${customer}
        ${goods}
        ${button(admin, "Open in admin", "12px 0 0")}`,
    footer: `Sent to the shop's owners because order ${esc(order.number)} was placed.`,
  })

  return { subject, html, text }
}
