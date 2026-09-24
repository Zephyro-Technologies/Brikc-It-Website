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
 * Dressed like the site: it opens and closes on the header's black with the
 * metal logo on it, the headline takes the hero's one red phrase, and the
 * accounts sit on white cards over the page's warm off-white. Tables and inline
 * styles, because that is all email clients reliably render. The logo is the
 * only image, and nothing depends on it: a client that blocks images shows its
 * alt text, and every number anybody has to type is text.
 */

export type PaymentEmail = { subject: string; html: string; text: string }

// The site's tokens (src/app/globals.css), as literals — an email has no stylesheet.
const INK = "#1c1b1f"
const MUTED = "#5f5d5a"
const LINE = "#ece6e0"
const PAGE = "#faf8f6"
const SURFACE_2 = "#f4f0ec"
const RED = "#d31f2e"
const RED_BRIGHT = "#f0384a"
/** The header's black, and the Best Sellers band's second stop. */
const CHROME = "#0b0b0d"
const CHROME_2 = "#121114"
/** A panel on the black, and white at about 60% over it. */
const PANEL = "#1b1a1e"
const PANEL_LINE = "#2c2a2f"
const ON_DARK_MUTED = "#a19ea2"
const SHADOW = "0 1px 2px rgba(28,27,31,0.06),0 1px 3px rgba(28,27,31,0.08)"
const SANS = "Roboto, Helvetica, Arial, sans-serif"
const SLAB = "'Roboto Slab', Georgia, 'Times New Roman', serif"

const SITE = "https://brikc.it"
/** Cut by scripts/brand-assets.py. PNG, because Outlook on Windows can't show WebP. */
const LOGO = `${SITE}/brand/logo-email.png`

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
    `<p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.65;color:${MUTED};${style}">${body}</p>`
  // nowrap: "BRK-1046" otherwise breaks at its hyphen, and half a reference is
  // what gets typed into a banking app.
  const strong = (s: string) => `<strong style="color:${INK};white-space:nowrap;">${esc(s)}</strong>`
  /** Joins the last two words, so a line never ends with one word alone under it. */
  const tie = (html: string) => html.replace(/ (\S+)$/, "&nbsp;$1")
  /** The page's field labels: small, spaced capitals. Data labels, not decoration. */
  const label = (s: string, color: string) =>
    `<p style="margin:0;font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${color};">${esc(s)}</p>`

  // Stacked, not side by side: half a phone's width broke "BRK-1046" and
  // "Rs 25,500" across two lines, and email clients can't be trusted with the
  // media query that would put them side by side only on a wide screen.
  const figure = (name: string, value: string, size: number, extra: string[], last: boolean) => `
            <tr><td style="padding:16px 20px;${last ? "" : `border-bottom:1px solid ${PANEL_LINE};`}">
              ${label(name, ON_DARK_MUTED)}
              <p style="margin:6px 0 0;font-family:${SLAB};font-size:${size}px;line-height:1.15;font-weight:800;color:#ffffff;white-space:nowrap;">${esc(value)}</p>
              ${extra
                .map((n) => `<p style="margin:6px 0 0;font-family:${SANS};font-size:13px;line-height:1.4;color:${ON_DARK_MUTED};">${esc(n)}</p>`)
                .join("")}
            </td></tr>`

  const account = (a: (typeof accounts)[number]) => `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="margin:0 0 14px;background:#ffffff;border:1px solid ${LINE};border-radius:20px;border-collapse:separate;box-shadow:${SHADOW};">
            <tr><td style="padding:14px 14px;border-bottom:1px solid ${LINE};font-family:${SLAB};font-size:17px;font-weight:700;color:${INK};">${esc(a.title)}</td></tr>
            ${a.rows
              .map(
                ([name, value], i) => `
            <tr><td style="padding:12px 14px;${i < a.rows.length - 1 ? `border-bottom:1px solid ${LINE};` : ""}">
              ${label(name, MUTED)}
              <p style="margin:4px 0 0;font-family:${SANS};font-size:16px;font-weight:700;color:${INK};word-break:break-all;">${esc(value)}</p>
            </td></tr>`,
              )
              .join("")}
          </table>`

  // The padding is on the link so the whole pill is the tap target. Outlook on
  // Windows only pads table cells, so mso-padding-alt — which only it reads —
  // gives the cell the same padding there instead of a collapsed bar.
  const button = whatsapp
    ? `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 0;">
            <tr><td align="center" bgcolor="${RED}" style="mso-padding-alt:16px 24px;border-radius:999px;box-shadow:0 2px 6px rgba(211,31,46,0.25),0 6px 16px rgba(211,31,46,0.18);">
              <a href="${esc(whatsapp)}" style="display:block;padding:16px 24px;font-family:${SLAB};font-size:17px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">Send the receipt on WhatsApp</a>
            </td></tr>
          </table>
          ${p("Opens WhatsApp with your order number already written out. Attach the screenshot and&nbsp;send.", "margin-top:10px;font-size:13px;line-height:1.5;text-align:center;")}`
    : ""

  const step = (n: number, body: string) => `
              <tr>
                <td width="26" valign="top" style="padding:7px 0;">
                  <div style="width:24px;height:24px;border-radius:12px;background:${RED};font-family:${SANS};font-size:12px;font-weight:700;line-height:24px;text-align:center;color:#ffffff;">${n}</div>
                </td>
                <td valign="top" style="padding:7px 0 7px 12px;font-family:${SANS};font-size:14px;line-height:1.6;color:${MUTED};">${tie(esc(body))}</td>
              </tr>`

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">
<title>${esc(subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;600;700&amp;family=Roboto+Slab:wght@700;800&amp;display=swap" rel="stylesheet">
<style>
  /* Mail apps turn anything that looks like a number, a date or a web address
     into a blue link — an account number most of all. Keep them as written. */
  a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font: inherit !important; }
  u + #body a { color: inherit; text-decoration: none; font: inherit; }
</style>
</head>
<body id="body" style="margin:0;padding:0;background:${SURFACE_2};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Transfer ${esc(total)} to confirm order ${esc(order.number)}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${SURFACE_2}" style="background:${SURFACE_2};">
  <tr><td align="center" style="padding:20px 10px 28px;">
    <!--[if mso]><table role="presentation" width="560" align="center" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

      <tr><td bgcolor="${CHROME}" style="padding:26px 20px 26px;background:${CHROME};background-image:linear-gradient(180deg,${CHROME} 0%,${CHROME_2} 100%);border-radius:24px 24px 0 0;">
        <a href="${SITE}" style="text-decoration:none;color:#ffffff;">
          <img src="${LOGO}" width="118" height="44" alt="brikc.it" style="display:block;width:118px;height:44px;border:0;outline:none;font-family:${SLAB};font-size:20px;font-weight:800;color:#ffffff;">
        </a>
        <h1 style="margin:26px 0 0;font-family:${SLAB};font-size:28px;line-height:1.2;font-weight:800;color:#ffffff;">Thanks${
          firstName ? `, ${esc(firstName)}` : ""
        } — <span style="color:${RED_BRIGHT};white-space:nowrap;">one step left.</span></h1>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${PANEL}" style="margin:22px 0 0;background:${PANEL};border:1px solid ${PANEL_LINE};border-radius:18px;border-collapse:separate;">
          ${figure("Your reference", order.number, 24, [], false)}
          ${figure("Amount to transfer", total, 30, notes, true)}
        </table>
      </td></tr>

      <tr><td bgcolor="${PAGE}" style="padding:26px 20px 30px;background:${PAGE};">
        ${p(
          `Nothing has been charged. Transfer ${strong(total)} to any one of the accounts below, then send us the ` +
            `receipt on WhatsApp with your reference ${strong(order.number)}. We confirm the order as soon as the ` +
            `transfer shows up, and that&rsquo;s when the build starts.`,
        )}

        <div style="margin-top:22px;">${accounts.map(account).join("")}</div>

        ${button}

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="margin:30px 0 0;background:#ffffff;border:1px solid ${LINE};border-radius:20px;border-collapse:separate;box-shadow:${SHADOW};">
          <tr><td style="padding:18px 20px 12px;">
            <p style="margin:0 0 4px;font-family:${SLAB};font-size:17px;font-weight:700;color:${INK};">What happens next</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${steps.map((s, i) => step(i + 1, s)).join("")}
            </table>
          </td></tr>
        </table>

        ${p(`Keep this reference: ${strong(order.number)}`, "margin-top:24px;font-size:14px;text-align:center;")}
      </td></tr>

      <tr><td bgcolor="${CHROME}" style="padding:20px 20px;background:${CHROME};border-radius:0 0 24px 24px;">
        <p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.6;text-align:center;color:${ON_DARK_MUTED};">Sent because order ${esc(order.number)} was placed on <a href="${SITE}" style="color:#ffffff;text-decoration:none;font-weight:600;">brikc.it</a> with this email address.</p>
      </td></tr>

    </table>
    <!--[if mso]></td></tr></table><![endif]-->
  </td></tr>
</table>
</body>
</html>`

  return { subject, html, text }
}
