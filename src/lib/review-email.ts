import { BUSINESS } from "../content/business"
import { firstName, type OrderEvent } from "./order-event"
import {
  INK,
  RED,
  SITE,
  SLAB,
  button,
  card,
  emailShell,
  esc,
  headline,
  p,
  siteLink,
  strong,
} from "./email-layout"

/**
 * Asking a customer for a review once their order is delivered, and asking
 * once more two days later if nothing has come in. The database decides when;
 * this decides what it says.
 *
 * One button per build, each to that build's page with #review on the end,
 * which opens the form (ProductReviews.tsx). Nothing about the customer goes in
 * the link — not the email, not the order number — because the page's address
 * is sent to Meta with every page view. The form asks for both, and this email
 * says what to type.
 *
 * Every claim here is what the form does: three photos and a video
 * (src/lib/supabase/upload.ts), and nothing shown until somebody publishes it
 * (submit_review stores it pending).
 *
 * Below the builds it asks, more quietly, for a review on Google too — the
 * profile is how people who have never heard of the shop find it. Every
 * delivered customer gets the same ask, worded the same: Google forbids
 * steering only the happy ones there. A Google review doesn't stop the
 * reminder, because nothing here can see one; only a review on the site does.
 */

export function reviewEmail(
  order: OrderEvent,
  reminder: boolean,
): { subject: string; html: string; text: string } {
  const name = firstName(order.customer.name)
  const one = order.builds.length === 1 ? order.builds[0] : null
  const it = one ? `the ${one.name}` : "your builds"

  const subject = reminder
    ? `A quick review of ${it}?`
    : one
      ? `How's the ${one.name} looking?`
      : "How are your builds looking?"

  const links = order.builds.map((b) => ({
    name: b.name,
    href: `${SITE}/shop/${encodeURIComponent(b.slug)}#review`,
  }))

  const opening = reminder
    ? `A couple of days ago we asked what you made of order ${order.number}. If you haven&rsquo;t had the chance yet, ` +
      `it only takes a few minutes, and this is the last time we&rsquo;ll ask.`
    : `Order ${order.number} has been delivered. Once it&rsquo;s on the shelf, we&rsquo;d love to hear what you ` +
      `make of it. A few honest lines and a photo of the finished build help the next person decide more than ` +
      `anything we can write.`

  const how =
    `The form asks for your order number, ${order.number}, and this email address, so every review on the site ` +
    `comes from somebody who bought the build. You can add up to three photos and a video. We read each one ` +
    `before it goes up.`

  const google = BUSINESS.googleReview
  const googleAsk = `We&rsquo;re on Google too. A review there helps people who have never heard of us find the shop.`

  // ── Plain text ───────────────────────────────────────────────────────────
  const text = [
    reminder ? `${name ? `${name}, got` : "Got"} a minute for a review?` : `${name ? `${name}, how` : "How"} did it turn out?`,
    "",
    opening.replace(/&rsquo;/g, "’"),
    "",
    ...links.flatMap((l) => [`Review the ${l.name}:`, l.href, ""]),
    how,
    ...(google ? ["", googleAsk.replace(/&rsquo;/g, "’"), `Review BrikcIt on Google: ${google}`] : []),
  ].join("\n")

  // ── HTML ─────────────────────────────────────────────────────────────────
  const buildCard = (l: (typeof links)[number]) =>
    card(`
            <tr><td style="padding:16px 16px 18px;">
              <p style="margin:0;font-family:${SLAB};font-size:17px;font-weight:700;color:${INK};">${esc(l.name)}</p>
              ${button(l.href, "Write a review", "14px 0 0")}
            </td></tr>`)

  const html = emailShell({
    subject,
    preheader: reminder
      ? `Only a few minutes, and the last time we'll ask.`
      : `Tell the next person what ${one ? one.name : "your builds"} turned out like.`,
    header: reminder
      ? headline(`${name ? `${esc(name)}, got` : "Got"} a minute`, "for a review?")
      : headline(`${name ? `${esc(name)}, how` : "How"} did it`, "turn out?"),
    body: `${p(opening.replace(order.number, strong(order.number)))}

        <div style="margin-top:22px;">${links.map(buildCard).join("")}</div>

        ${p(how.replace(order.number, strong(order.number)), "margin-top:12px;font-size:14px;")}${
          google
            ? `

        ${p(
          `${googleAsk} <a href="${esc(google)}" style="color:${RED};font-weight:600;text-decoration:none;white-space:nowrap;">Review BrikcIt on Google</a>`,
          "margin-top:18px;font-size:14px;",
        )}`
            : ""
        }`,
    footer: `Sent because order ${esc(order.number)}, placed with ${siteLink} using this email address, was delivered.`,
  })

  return { subject, html, text }
}
