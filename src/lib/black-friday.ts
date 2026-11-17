/**
 * Blessed Friday 2026 — every number and date for the sale lives HERE and only
 * here. Tweak a price in this file and the page, the cart and the server all
 * follow; nothing below is read from the database and no component holds a
 * copy.
 *
 * The sale is time-boxed in Pakistan time (Asia/Karachi, UTC+5 year-round — no
 * DST), expressed as UTC instants so the server, the browser and anyone's
 * wristwatch agree. Outside the window the page shows its closed state, the
 * announcement bar disappears, and /api/bf/order refuses — all three read the
 * same two constants, so there is nothing to redeploy.
 */

/**
 * Mon 16 Nov 2026, 00:00 PKT — already past: the sale is live from the moment
 * it deploys and runs the rest of November. The countdown on the page counts
 * down to the END below.
 */
export const BF_START_MS = Date.UTC(2026, 10, 15, 19, 0, 0)
/** Mon 30 Nov 2026, 23:59:59.999 PKT. */
export const BF_END_MS = Date.UTC(2026, 10, 30, 18, 59, 59, 999)

/* ── The prices ─────────────────────────────────────────────────────────── */

/**
 * Pick-your-own Speed Champions bundle: how many cars for how much. Keys are
 * the only pick counts that make a bundle — four picks is "one more for the
 * five-car price", not a price of its own.
 */
export const BUILDER_TIERS: Record<number, number> = {
  2: 6_999,
  3: 8_999,
  5: 14_499,
}

/**
 * A two-car bundle made only of the Rs 3,500 cars costs less; a pair with any
 * Rs 4,500 car in it stays at the full pick-2 price above. Three- and
 * five-car bundles are one price whatever the mix.
 */
export const PICK2_BUDGET_PRICE = 5_999
/** A car at this everyday (boxed) price or under counts as a budget car. */
export const BUDGET_CAR_MAX = 3_500

/**
 * What a builder bundle costs, given the picks and a way to look up each
 * car's everyday boxed price — the page passes its product list, the checkout
 * its catalogue, the order route its database rows, so all three agree and
 * none trusts a price the browser sent.
 */
export function builderPrice(
  tier: number,
  picks: { slug: string; qty: number }[],
  priceOf: (slug: string) => number,
): number {
  const base = BUILDER_TIERS[tier] ?? 0
  if (tier !== 2 || !base) return base
  const allBudget =
    picks.length > 0 &&
    picks.every((p) => {
      const price = priceOf(p.slug)
      return price > 0 && price <= BUDGET_CAR_MAX
    })
  return allBudget ? PICK2_BUDGET_PRICE : base
}

/**
 * Which builds count as Speed Champions singles. Slugs, not a category: the
 * grid set (f1-2024-grid-speed-champions-set) must stay out, and a slug list
 * is explicit about that. A sold-out car stays in the list — the page hides
 * anything whose live stock is zero, so the list never needs editing for
 * stock.
 */
export const BUILDER_SLUGS = [
  "red-bull-rb20-speed-champions",
  "mclaren-mcl38-speed-champions",
  "ferrari-sf24-speed-champions",
  "mercedes-w15-speed-champions",
  "aston-martin-amr24-speed-champions",
  "alpine-a524-speed-champions",
  "williams-fw46-speed-champions",
  "haas-vf24-speed-champions",
  "kick-sauber-c44-speed-champions",
  "vcarb-01-speed-champions",
]

/**
 * Straight slashed prices on the big models. A deal sells the build in the
 * cheapest assembly it is actually sold in — unassembled where that exists,
 * assembled otherwise (the Shelby is sold assembled only; its Rs 16,000 was
 * always the assembled price) — and the card says which. `saleFormat()` below
 * is the one place that decides.
 */
export const BF_DEALS: Record<string, number> = {
  f1redbull: 23_800, // Red Bull Racing RB20 F1 · Rs 28,000 unassembled →
  f1mclaren: 16_000, // McLaren Formula 1 · Rs 19,000 unassembled →
  "shelby-cobra-427": 13_500, // Shelby Cobra 427 S/C · Rs 16,000 assembled →
}

/**
 * Which assembly a Blessed Friday deal sells, and what it normally costs that
 * way. Boxed when the build is sold boxed, else built, else nothing — read
 * from whatever row shape the caller has, so the page, the checkout and the
 * order route all resolve a deal the same way.
 */
export function saleFormat(p: {
  sellsBoxed: boolean
  sellsBuilt: boolean
  priceBoxed: number
  priceBuilt: number
}): { format: "boxed" | "built"; price: number } | null {
  if (p.sellsBoxed && p.priceBoxed > 0) return { format: "boxed", price: p.priceBoxed }
  if (p.sellsBuilt && p.priceBuilt > 0) return { format: "built", price: p.priceBuilt }
  return null
}

/** The RB20 + McLaren pair, one line, both stocks must hold. */
export const BF_DOUBLE = {
  slugs: ["f1redbull", "f1mclaren"] as [string, string],
  price: 37_999,
}

/* ── The window ─────────────────────────────────────────────────────────── */

export type BfState = "upcoming" | "live" | "ended"

export function bfState(now: number = Date.now()): BfState {
  if (now < BF_START_MS) return "upcoming"
  if (now > BF_END_MS) return "ended"
  return "live"
}

export const bfLive = (now: number = Date.now()) => bfState(now) === "live"

/* ── What a Blessed Friday line carries in the cart and on the wire ───────── */

/** One chosen car inside a builder bundle. Name rides along for the drawer. */
export type BfPick = { slug: string; name: string; qty: number }

export type BfSelection =
  | { kind: "builder"; tier: number; picks: BfPick[] }
  /** `format` is which assembly this deal sells (the Shelby is built-only) — set
   *  where the line is added, shown in the cart, re-derived by the server. */
  | { kind: "deal"; slug: string; format?: "boxed" | "built" }
  | { kind: "double" }

/** A deliberately un-slug-like prefix, so no catalogue row can collide. */
export const BF_LINE_SLUG = {
  builder: (tier: number) => `bf!builder-${tier}`,
  double: "bf!double",
}

/** The one key per distinct selection, so identical picks merge into qty. */
export function bfLineKey(sel: BfSelection): string {
  if (sel.kind === "deal") return `bf!deal-${sel.slug}`
  if (sel.kind === "double") return BF_LINE_SLUG.double
  const picks = [...sel.picks]
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((p) => `${p.slug}x${p.qty}`)
    .join("+")
  return `${BF_LINE_SLUG.builder(sel.tier)}:${picks}`
}

/**
 * What one unit of this selection costs. For a builder bundle the answer can
 * depend on which cars are in it, so callers that have catalogue prices pass
 * `priceOf`; without it the full tier price is assumed (never undercharges).
 */
export function bfUnitPrice(sel: BfSelection, priceOf?: (slug: string) => number): number {
  if (sel.kind === "deal") return BF_DEALS[sel.slug] ?? 0
  if (sel.kind === "double") return BF_DOUBLE.price
  if (priceOf) return builderPrice(sel.tier, sel.picks, priceOf)
  return BUILDER_TIERS[sel.tier] ?? 0
}

export function describeBf(sel: BfSelection): string {
  if (sel.kind === "deal")
    return sel.format === "built"
      ? "Assembled · Blessed Friday price"
      : "Unassembled · Blessed Friday price"
  if (sel.kind === "double") return "2 kits, unassembled · Blessed Friday price"
  return sel.picks.map((p) => (p.qty > 1 ? `${p.name} ×${p.qty}` : p.name)).join(", ")
}

/** How many of one build a selection consumes, per unit of the line. */
export function bfDemand(sel: BfSelection): { slug: string; qty: number }[] {
  if (sel.kind === "deal") return [{ slug: sel.slug, qty: 1 }]
  if (sel.kind === "double") return BF_DOUBLE.slugs.map((slug) => ({ slug, qty: 1 }))
  return sel.picks.map((p) => ({ slug: p.slug, qty: p.qty }))
}
