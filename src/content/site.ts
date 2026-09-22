/**
 * Site chrome and homepage copy that has no admin screen.
 *
 * Every claim here has to be one the shop can stand behind. The design this was
 * ported from carried a prototype's placeholder marketing — UK shipping
 * thresholds, sold counts, an app that doesn't exist — and none of it survived
 * the move. What is left is navigation and the how-it-works steps, both of
 * which describe the site rather than make a claim about an offer.
 *
 * The announcement bar used to live here and is now `settings.banner`: it was
 * the one string in this file that made a promise with a date on it, and
 * changing it should not need a deploy.
 */

export const NAV: { label: string; to: string; shortcut?: boolean }[] = [
  { label: "Best Sellers", to: "/best-sellers" },
  { label: "Shop", to: "/shop" },
  { label: "Displays", to: "/displays" },
  // The assembly manuals, one per build. The written booklets are still at
  // /booklets and are linked from the bottom of that page — they were what
  // "Guides" meant before there was a PDF to download.
  { label: "Guides", to: "/guides" },
  // A shortcut into the shop rather than a section of the site, which is what
  // `shortcut` marks: it stays out of the footer's list of places to go, and it
  // never lights up as the current page — being under ten thousand rupees is a
  // way of looking at the shop, and the Shop tab is already the right answer to
  // "where am I".
  { label: "Under 10k", to: "/shop?price=under-10k", shortcut: true },
]

export const STEPS = [
  {
    n: "01",
    title: "Pick a build",
    desc: "Browse F1, cars and bikes, or take one of the limited collector sets.",
  },
  {
    n: "02",
    title: "Choose the format",
    desc: "Unassembled in the box or built by hand, with a display frame — lit or plain — if you want one.",
  },
  {
    n: "03",
    title: "We build and deliver",
    desc: "Assembled, inspected and double-boxed, then couriered anywhere in Pakistan.",
  },
]

