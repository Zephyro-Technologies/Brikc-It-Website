/**
 * What every email the shop sends is drawn in: the site's colours as literals,
 * the escaping, and the frame — the header's black with the metal logo at the
 * top, the page's off-white for the body, the black again at the foot.
 *
 * Tables and inline styles, because that is all email clients reliably render.
 * The logo is the only image, and nothing depends on it: a client that blocks
 * images shows its alt text.
 */

// The site's tokens (src/app/globals.css), as literals — an email has no stylesheet.
export const INK = "#1c1b1f"
export const MUTED = "#5f5d5a"
export const LINE = "#ece6e0"
export const PAGE = "#faf8f6"
export const SURFACE_2 = "#f4f0ec"
export const RED = "#d31f2e"
export const RED_BRIGHT = "#f0384a"
/** The header's black, and the Best Sellers band's second stop. */
export const CHROME = "#0b0b0d"
export const CHROME_2 = "#121114"
/** A panel on the black, and white at about 60% over it. */
export const PANEL = "#1b1a1e"
export const PANEL_LINE = "#2c2a2f"
export const ON_DARK_MUTED = "#a19ea2"
export const SHADOW = "0 1px 2px rgba(28,27,31,0.06),0 1px 3px rgba(28,27,31,0.08)"
export const SANS = "Roboto, Helvetica, Arial, sans-serif"
export const SLAB = "'Roboto Slab', Georgia, 'Times New Roman', serif"

export const SITE = "https://brikc.it"
/** Cut by scripts/brand-assets.py. PNG, because Outlook on Windows can't show WebP. */
const LOGO = `${SITE}/brand/logo-email.png`

/** Every value in the HTML passes through this — names and addresses are whatever somebody typed. */
export const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

export const p = (body: string, style = "") =>
  `<p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.65;color:${MUTED};${style}">${body}</p>`

// nowrap: "BRK-1046" otherwise breaks at its hyphen, and half a reference is
// what gets typed into a banking app.
export const strong = (s: string) => `<strong style="color:${INK};white-space:nowrap;">${esc(s)}</strong>`

/** Joins the last two words, so a line never ends with one word alone under it. */
export const tie = (html: string) => html.replace(/ (\S+)$/, "&nbsp;$1")

/** The page's field labels: small, spaced capitals. Data labels, not decoration. */
export const label = (s: string, color: string) =>
  `<p style="margin:0;font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${color};">${esc(s)}</p>`

/** The headline on the black, with its last phrase in the hero's one red. */
export const headline = (plain: string, red: string) =>
  `<h1 style="margin:26px 0 0;font-family:${SLAB};font-size:28px;line-height:1.2;font-weight:800;color:#ffffff;">${plain}${
    red ? ` <span style="color:${RED_BRIGHT};white-space:nowrap;">${red}</span>` : ""
  }</h1>`

/** A white card on the off-white, the site's surface. */
export const card = (inner: string, margin = "0 0 14px") => `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="margin:${margin};background:#ffffff;border:1px solid ${LINE};border-radius:20px;border-collapse:separate;box-shadow:${SHADOW};">${inner}
          </table>`

/**
 * The red pill. The padding is on the link so the whole pill is the tap target.
 * Outlook on Windows only pads table cells, so mso-padding-alt — which only it
 * reads — gives the cell the same padding there instead of a collapsed bar.
 */
export const button = (href: string, text: string, margin = "26px 0 0") => `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:${margin};">
            <tr><td align="center" bgcolor="${RED}" style="mso-padding-alt:16px 24px;border-radius:999px;box-shadow:0 2px 6px rgba(211,31,46,0.25),0 6px 16px rgba(211,31,46,0.18);">
              <a href="${esc(href)}" style="display:block;padding:16px 24px;font-family:${SLAB};font-size:17px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${esc(text)}</a>
            </td></tr>
          </table>`

export function emailShell({
  subject,
  preheader,
  header,
  body,
  footer,
}: {
  subject: string
  /** The line an inbox shows after the subject. Plain text. */
  preheader: string
  /** HTML under the logo, on the black: the headline and anything beside it. */
  header: string
  /** HTML on the off-white. */
  body: string
  /** HTML in the black strip at the foot, already escaped. */
  footer: string
}): string {
  return `<!doctype html>
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
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${SURFACE_2}" style="background:${SURFACE_2};">
  <tr><td align="center" style="padding:20px 10px 28px;">
    <!--[if mso]><table role="presentation" width="560" align="center" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

      <tr><td bgcolor="${CHROME}" style="padding:26px 20px 26px;background:${CHROME};background-image:linear-gradient(180deg,${CHROME} 0%,${CHROME_2} 100%);border-radius:24px 24px 0 0;">
        <a href="${SITE}" style="text-decoration:none;color:#ffffff;">
          <img src="${LOGO}" width="118" height="44" alt="brikc.it" style="display:block;width:118px;height:44px;border:0;outline:none;font-family:${SLAB};font-size:20px;font-weight:800;color:#ffffff;">
        </a>
        ${header}
      </td></tr>

      <tr><td bgcolor="${PAGE}" style="padding:26px 20px 30px;background:${PAGE};">
        ${body}
      </td></tr>

      <tr><td bgcolor="${CHROME}" style="padding:20px 20px;background:${CHROME};border-radius:0 0 24px 24px;">
        <p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.6;text-align:center;color:${ON_DARK_MUTED};">${footer}</p>
      </td></tr>

    </table>
    <!--[if mso]></td></tr></table><![endif]-->
  </td></tr>
</table>
</body>
</html>`
}

/** The site's name as a link in the footer strip. */
export const siteLink = `<a href="${SITE}" style="color:#ffffff;text-decoration:none;font-weight:600;">brikc.it</a>`
