import type { PaymentDetails, ShippingMethod } from "../data"
import { money } from "./money"
import { paymentAccounts, receiptLink, type PlacedOrder } from "./checkout"
import {
  INK,
  LINE,
  MUTED,
  ON_DARK_MUTED,
  PANEL,
  PANEL_LINE,
  RED,
  SANS,
  SHADOW,
  SLAB,
  button,
  emailShell,
  esc,
  headline,
  label,
  p,
  siteLink,
  strong,
  tie,
} from "./email-layout"

/**
 * The payment details for an order, emailed to the person it is for. It says
 * what `OrderConfirmation.tsx` says — the same accounts, from the same
 * `paymentAccounts()`, and the same sentences — so the inbox and the page can
 * never tell somebody two different things. Change the copy in both places
 * together.
 *
 * Built here rather than as a template stored at Brevo: the accounts are edited
 * in the admin, and a second copy of them in another dashboard is one nobody
 * would remember to update.
 *
 * Dressed like the site (see email-layout.ts): the headline takes the hero's one
 * red phrase, and the accounts sit on white cards over the page's warm
 * off-white. Every number anybody has to type is text.
 */

export type PaymentEmail = { subject: string; html: string; text: string }

export function paymentEmail(
  order: PlacedOrder & {
    /**
     * How it is being delivered. A site order only costs anything to deliver
     * by hand, so the confirmation page goes by the fee; a manual order can
     * carry a courier charge too, so the email asks the method when it has it.
     */
    method?: ShippingMethod
    /**
     * Chosen to pay online. The shopper is paying on the confirmation page as
     * this goes out, so it says the order is in and that a receipt follows —
     * and keeps the transfer details below, for a payment that didn't go
     * through. A receipt (paid-email.ts) follows when Rapid Gateway confirms.
     */
    payingOnline?: boolean
  },
  payment: PaymentDetails,
): PaymentEmail {
  const online = order.payingOnline === true
  const firstName = order.name.trim().split(/\s+/)[0]
  const greeting = online
    ? `Thanks${firstName ? `, ${firstName}` : ""} — your order is in.`
    : `Thanks${firstName ? `, ${firstName}` : ""} — one step left.`
  const total = money(order.total)
  const discount = order.discount ?? 0
  const accounts = paymentAccounts(payment)
  const handDelivered = order.method ? order.method === "teamhq" : order.shipping > 0
  // canCheckout() keeps the checkout shut without a WhatsApp number, but an
  // order can reach place_order without the checkout. No number, no button,
  // rather than a link to a wa.me page that goes nowhere.
  const whatsapp = payment.whatsapp ? receiptLink(payment.whatsapp, order) : ""

  const notes: string[] = []
  if (discount > 0) notes.push(`${order.coupon} took off ${money(discount)}`)
  if (order.shipping > 0) notes.push(`Includes ${money(order.shipping)} for ${order.deliveryLabel.toLowerCase()}`)

  const steps = online
    ? [
        "Paid online: your receipt follows as soon as Rapid Gateway confirms the payment, and the order is confirmed.",
        "Paying by transfer instead: send us the receipt on WhatsApp, and we confirm once it lands.",
        `Your build starts. ${
          handDelivered ? "We arrange a time with you and bring it round in person." : "We send tracking once it ships."
        }`,
      ]
    : [
    "You transfer the amount and send us the receipt.",
    "We check it against the order and confirm on WhatsApp.",
    `Your build starts. ${
      handDelivered ? "We arrange a time with you and bring it round in person." : "We send tracking once it ships."
    }`,
      ]

  const subject = online ? `Order ${order.number} — received` : `Order ${order.number} — transfer details`

  // For an online order, what the opening says before the transfer details
  // become a fallback rather than the plan.
  const onlineIntro =
    `You chose to pay online. If you finished paying on the order page, you’re all set: a receipt follows as soon ` +
    `as Rapid Gateway confirms it. If the payment didn’t go through, you can pay by transfer instead — ` +
    `${total} to any one of the accounts below, with your reference ${order.number}, and send us the receipt on WhatsApp.`
  const transferIntro =
    `Nothing has been charged. Transfer ${total} to any one of the accounts below, then send us the receipt on ` +
    `WhatsApp with your reference ${order.number}. We confirm the order as soon as the transfer shows up, and ` +
    `that’s when the build starts.`

  // ── Plain text ───────────────────────────────────────────────────────────
  const text = [
    greeting,
    "",
    `Your reference: ${order.number}`,
    `${online ? "Order total" : "Amount to transfer"}: ${total}`,
    ...notes,
    "",
    online ? onlineIntro : transferIntro,
    "",
    ...accounts.flatMap((a) => [a.title, ...a.rows.map(([name, value]) => `  ${name}: ${value}`), ""]),
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

  const receipt = whatsapp
    ? `${button(whatsapp, "Send the receipt on WhatsApp")}
          ${p("Opens WhatsApp with your order number already written out. Attach the screenshot and&nbsp;send.", "margin-top:10px;font-size:13px;line-height:1.5;text-align:center;")}`
    : ""

  const step = (n: number, body: string) => `
              <tr>
                <td width="26" valign="top" style="padding:7px 0;">
                  <div style="width:24px;height:24px;border-radius:12px;background:${RED};font-family:${SANS};font-size:12px;font-weight:700;line-height:24px;text-align:center;color:#ffffff;">${n}</div>
                </td>
                <td valign="top" style="padding:7px 0 7px 12px;font-family:${SANS};font-size:14px;line-height:1.6;color:${MUTED};">${tie(esc(body))}</td>
              </tr>`

  const html = emailShell({
    subject,
    preheader: online
      ? `Order ${order.number} is in. A receipt follows once your payment is confirmed.`
      : `Transfer ${total} to confirm order ${order.number}.`,
    header: `${headline(`Thanks${firstName ? `, ${esc(firstName)}` : ""} —`, online ? "your order is in." : "one step left.")}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${PANEL}" style="margin:22px 0 0;background:${PANEL};border:1px solid ${PANEL_LINE};border-radius:18px;border-collapse:separate;">
          ${figure("Your reference", order.number, 24, [], false)}
          ${figure(online ? "Order total" : "Amount to transfer", total, 30, notes, true)}
        </table>`,
    body: `${p(
      esc(online ? onlineIntro : transferIntro)
        .replace(esc(total), strong(total))
        .replace(esc(order.number), strong(order.number)),
    )}

        <div style="margin-top:22px;">${accounts.map(account).join("")}</div>

        ${receipt}

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="margin:30px 0 0;background:#ffffff;border:1px solid ${LINE};border-radius:20px;border-collapse:separate;box-shadow:${SHADOW};">
          <tr><td style="padding:18px 20px 12px;">
            <p style="margin:0 0 4px;font-family:${SLAB};font-size:17px;font-weight:700;color:${INK};">What happens next</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${steps.map((s, i) => step(i + 1, s)).join("")}
            </table>
          </td></tr>
        </table>

        ${p(`Keep this reference: ${strong(order.number)}`, "margin-top:24px;font-size:14px;text-align:center;")}`,
    // "With", not "on": an order typed into the admin was placed with the shop
    // over WhatsApp or Instagram, never on the site.
    footer: `Sent because order ${esc(order.number)} was placed with ${siteLink} using this email address.`,
  })

  return { subject, html, text }
}
