import type { PaymentDetails } from "../data"
import { money } from "./money"
import { paymentAccounts, receiptLink, type PlacedOrder } from "./checkout"

/**
 * The one email a shopper gets: the payment details for the order they have
 * just placed. It says what `OrderConfirmation.tsx` says — the same accounts,
 * from the same `paymentAccounts()`, and the same sentences — so the inbox and
 * the page can never tell somebody two different things. Change the copy in
 * both places together.
 *
 * Built here rather than as a template stored at Brevo: the accounts are edited
 * in the admin, and a second copy of them in another dashboard is one nobody
 * would remember to update.
 *
 * Tables and inline styles, because that is all email clients reliably render.
 * No images: a client that blocks them must not be able to hide an account
 * number, and none of this needs one.
 */

export type PaymentEmail = { subject: string; html: string; text: string }

const INK = "#1c1b1f"
const MUTED = "#5f5d5a"
const LINE = "#e7e2dd"
const PAGE = "#faf8f6"
const RED = "#d31f2e"
const CHROME = "#0b0b0d"
const SANS = "Roboto, Helvetica, Arial, sans-serif"
const SLAB = "'Roboto Slab', Georgia, 'Times New Roman', serif"

/** Every value in the HTML passes through this — the name is whatever the shopper typed. */
const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

export function paymentEmail(order: PlacedOrder, payment: PaymentDetails): PaymentEmail {
  const firstName = order.name.trim().split(/\s+/)[0]
  const greeting = `Thanks${firstName ? `, ${firstName}` : ""} — one step left.`
  const total = money(order.total)
  const discount = order.discount ?? 0
  const accounts = paymentAccounts(payment)
  // canCheckout() keeps the checkout shut without a WhatsApp number, but an
  // order can reach place_order without the checkout. No number, no button,
  // rather than a link to a wa.me page that goes nowhere.
  const whatsapp = payment.whatsapp ? receiptLink(payment.whatsapp, order) : ""

  const notes: string[] = []
  if (discount > 0) notes.push(`${order.coupon} took off ${money(discount)}`)
  if (order.shipping > 0) notes.push(`Includes ${money(order.shipping)} for ${order.deliveryLabel.toLowerCase()}`)

  const steps = [
    "You transfer the amount and send us the receipt.",
    "We check it against the order and confirm on WhatsApp.",
    `Your build starts. ${
      order.shipping > 0 ? "We arrange a time with you and bring it round in person." : "We send tracking once it ships."
    }`,
  ]

  const subject = `Order ${order.number} — transfer details`

  // ── Plain text ───────────────────────────────────────────────────────────
  const text = [
    greeting,
    "",
    `Your reference: ${order.number}`,
    `Amount to transfer: ${total}`,
    ...notes,
    "",
    `Nothing has been charged. Transfer ${total} to any one of the accounts below, then send us the receipt on ` +
      `WhatsApp with your reference ${order.number}. We confirm the order as soon as the transfer shows up, and ` +
      `that's when the build starts.`,
    "",
    ...accounts.flatMap((a) => [a.title, ...a.rows.map(([label, value]) => `  ${label}: ${value}`), ""]),
    ...(whatsapp
      ? [
          "Send the receipt on WhatsApp:",
          whatsapp,
          "Opens WhatsApp with your order number already written out. Attach the screenshot and send.",
          "",
        ]
      : []),
    "What happens next",
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    `Keep this reference: ${order.number}`,
  ].join("\n")

  // ── HTML ─────────────────────────────────────────────────────────────────
  const p = (body: string, style = "") =>
    `<p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.6;color:${MUTED};${style}">${body}</p>`
  // nowrap: "BRK-1046" otherwise breaks at its hyphen, and half a reference is
  // what gets typed into a banking app.
  const strong = (s: string) => `<strong style="color:${INK};white-space:nowrap;">${esc(s)}</strong>`

  // Stacked, not side by side: half a phone's width broke "BRK-1046" and
  // "Rs 25,500" across two lines, and email clients can't be trusted with the
  // media query that would put them side by side only on a wide screen.
  const figure = (label: string, value: string, extra: string[], last: boolean) => `
    <tr><td style="padding:14px 18px;background:#ffffff;${last ? "" : `border-bottom:1px solid ${LINE};`}">
      <p style="margin:0;font-family:${SANS};font-size:12px;color:${MUTED};">${esc(label)}</p>
      <p style="margin:4px 0 0;font-family:${SLAB};font-size:22px;font-weight:800;color:${INK};white-space:nowrap;">${esc(value)}</p>
      ${extra
        .map((n) => `<p style="margin:4px 0 0;font-family:${SANS};font-size:12px;color:${MUTED};">${esc(n)}</p>`)
        .join("")}
    </td></tr>`

  const account = (a: (typeof accounts)[number]) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;border:1px solid ${LINE};border-radius:16px;background:#ffffff;border-collapse:separate;">
      <tr><td style="padding:12px 14px;border-bottom:1px solid ${LINE};font-family:${SLAB};font-size:16px;font-weight:700;color:${INK};">${esc(a.title)}</td></tr>
      ${a.rows
        .map(
          ([label, value], i) => `
      <tr><td style="padding:10px 14px;${i < a.rows.length - 1 ? `border-bottom:1px solid ${LINE};` : ""}">
        <p style="margin:0;font-family:${SANS};font-size:12px;color:${MUTED};">${esc(label)}</p>
        <p style="margin:2px 0 0;font-family:${SANS};font-size:16px;font-weight:600;color:${INK};word-break:break-all;">${esc(value)}</p>
      </td></tr>`,
        )
        .join("")}
    </table>`

  const button = whatsapp
    ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
      <tr><td align="center" bgcolor="${RED}" style="border-radius:999px;">
        <a href="${esc(whatsapp)}" style="display:block;padding:15px 24px;font-family:${SLAB};font-size:17px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">Send the receipt on WhatsApp</a>
      </td></tr>
    </table>
    ${p("Opens WhatsApp with your order number already written out. Attach the screenshot and send.", "margin-top:10px;font-size:13px;text-align:center;")}`
    : ""

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Transfer ${esc(total)} to confirm order ${esc(order.number)}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE};">
  <tr><td align="center" style="padding:16px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
      <tr><td style="padding:16px 18px;background:${CHROME};border-radius:16px 16px 0 0;font-family:${SLAB};font-size:20px;font-weight:800;color:#ffffff;">brikc.it</td></tr>
      <tr><td style="padding:24px 18px 28px;background:${PAGE};border:1px solid ${LINE};border-top:0;border-radius:0 0 16px 16px;">

        <h1 style="margin:0;font-family:${SLAB};font-size:26px;line-height:1.25;font-weight:800;color:${INK};">${esc(greeting)}</h1>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;border:1px solid ${LINE};border-radius:16px;border-collapse:separate;overflow:hidden;">
          ${figure("Your reference", order.number, [], false)}
          ${figure("Amount to transfer", total, notes, true)}
        </table>

        ${p(
          `Nothing has been charged. Transfer ${strong(total)} to any one of the accounts below, then send us the ` +
            `receipt on WhatsApp with your reference ${strong(order.number)}. We confirm the order as soon as the ` +
            `transfer shows up, and that&rsquo;s when the build starts.`,
          "margin-top:20px;",
        )}

        <div style="margin-top:24px;">${accounts.map(account).join("")}</div>

        ${button}

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 0;border:1px solid ${LINE};border-radius:16px;background:#ffffff;border-collapse:separate;">
          <tr><td style="padding:18px 20px;">
            <p style="margin:0 0 8px;font-family:${SLAB};font-size:16px;font-weight:700;color:${INK};">What happens next</p>
            ${steps.map((s, i) => p(`${i + 1}. ${esc(s)}`, "font-size:14px;margin-top:4px;")).join("")}
          </td></tr>
        </table>

        ${p(`Keep this reference: ${strong(order.number)}`, "margin-top:24px;font-size:14px;text-align:center;")}
      </td></tr>
      <tr><td style="padding:16px 24px 0;">
        ${p(`Sent because order ${esc(order.number)} was placed on brikc.it with this email address.`, "font-size:12px;text-align:center;")}
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`

  return { subject, html, text }
}
