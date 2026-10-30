import { eventLineLabel, firstName, type OrderEvent } from "./order-event"
import {
  INK,
  LINE,
  MONO,
  MUTED,
  ON_DARK_MUTED,
  PANEL,
  PANEL_LINE,
  SANS,
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
 * Telling a customer their order has left: sent once, by the database, on the
 * order's first move into shipped. The database decides when; this decides
 * what it says.
 *
 * A courier order names the courier and the tracking number, which is what the
 * payment email and the confirmation page promised ("We send tracking once it
 * ships"). There is no "track your parcel" button: the courier is free text,
 * typed by the owner, and changes from order to order, so there is no address
 * anybody could link to that would be right. The number is set in a fixed-width
 * face and never wrapped onto a second line by a hyphen, because it is what
 * somebody copies into the courier's site.
 *
 * A hand-delivered order has no courier and no number — TEAM HQ brings it round
 * — so it says that instead.
 *
 * No delivery time: nothing on the order says when it will arrive, and a guess
 * in an email is a promise the shop didn't make.
 */
export function shippedEmail(order: OrderEvent, deliveryLabel: string): { subject: string; html: string; text: string } {
  const name = firstName(order.customer.name)
  const handDelivered = order.method === "teamhq"
  // The database refuses to ship a courier order without both, so these are
  // there; an order shipped before that rule, or hand-entered in SQL, may not
  // have them, and the email leaves out what it hasn't got rather than print
  // an empty box.
  const courier = handDelivered ? "" : order.tracking.courier
  const tracking = handDelivered ? "" : order.tracking.number
  const by = courier || "the courier"

  const subject = `Your order ${order.number} is on its way`

  // Written once and drawn twice: `ref` is how a number somebody has to type is
  // set, `words` how anything else that came from the order is, so the HTML
  // escapes every value and the plain text keeps them as they were typed.
  const opening = (ref: (s: string) => string, words: (s: string) => string) =>
    handDelivered
      ? `Order ${ref(order.number)} is on its way to you. TEAM HQ is bringing it round in person, so there’s no ` +
        `courier and no tracking number. If we haven’t already agreed a time with you, we’ll be in touch on ` +
        `WhatsApp to arrange one.`
      : tracking
        ? `Order ${ref(order.number)} has been handed to ${words(by)}. Your tracking number is ${ref(tracking)}; ` +
          `${words(by)} can tell you where the parcel is from it.`
        : `Order ${ref(order.number)} has been handed to ${words(by)}.`
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
    `${name ? `${name}, your` : "Your"} order is on its way.`,
    "",
    `Order: ${order.number}`,
    ...(handDelivered
      ? [`Delivery: ${deliveryLabel}`]
      : [...(courier ? [`Courier: ${courier}`] : []), ...(tracking ? [`Tracking number: ${tracking}`] : [])]),
    "",
    opening(asTyped, asTyped),
    "",
    "What you ordered:",
    ...lines.map((l) => `${l.title}${l.detail ? ` (${l.detail})` : ""}`),
    "",
    "Delivering to:",
    ...address,
    "",
    "Questions about the delivery? Reply to this email.",
  ].join("\n")

  // ── HTML ─────────────────────────────────────────────────────────────────
  const figure = (title: string, value: string, size: number, last: boolean, font = SLAB) => `
            <tr><td style="padding:16px 20px;${last ? "" : `border-bottom:1px solid ${PANEL_LINE};`}">
              ${label(title, ON_DARK_MUTED)}
              <p style="margin:6px 0 0;font-family:${font};font-size:${size}px;line-height:1.2;font-weight:800;color:#ffffff;${
                font === MONO ? "letter-spacing:0.04em;word-break:break-all;" : ""
              }">${esc(value)}</p>
            </td></tr>`

  const figures = handDelivered
    ? [
        figure("Order", order.number, 24, false),
        figure("Delivery", deliveryLabel, 20, true),
      ]
    : [
        figure("Order", order.number, 24, !courier && !tracking),
        ...(courier ? [figure("Courier", courier, 20, !tracking)] : []),
        ...(tracking ? [figure("Tracking number", tracking, 24, true, MONO)] : []),
      ]

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

  const destination = address.length
    ? card(`
            ${heading("Delivering to")}
            <tr><td style="padding:12px 14px;font-family:${SANS};font-size:14px;line-height:1.6;color:${INK};">${address.map(esc).join("<br>")}</td></tr>`, "14px 0 0")
    : ""

  const html = emailShell({
    subject,
    preheader: handDelivered
      ? `TEAM HQ is bringing order ${order.number} to you in person.`
      : tracking
        ? `${courier ? `${courier} tracking number` : "Tracking number"} ${tracking}.`
        : `Order ${order.number} has been handed to ${by}.`,
    header: `${headline(`${name ? `${esc(name)}, your` : "Your"} order is`, "on its way.")}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${PANEL}" style="margin:22px 0 0;background:${PANEL};border:1px solid ${PANEL_LINE};border-radius:18px;border-collapse:separate;">
          ${figures.join("")}
        </table>`,
    body: `${p(opening(strong, esc))}
        ${items}
        ${destination}
        ${p("Questions about the delivery? Reply to this email.", "margin-top:24px;font-size:14px;text-align:center;")}`,
    footer: `Sent because order ${esc(order.number)}, placed with ${siteLink} using this email address, was ${
      handDelivered ? "sent out for delivery" : "shipped"
    }.`,
  })

  return { subject, html, text }
}
