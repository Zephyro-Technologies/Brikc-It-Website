/**
 * Site chrome and homepage copy that has no admin screen.
 *
 * Every claim here has to be one the shop can stand behind. The design this was
 * ported from carried a prototype's placeholder marketing — UK shipping
 * thresholds, sold counts, an app that doesn't exist — and none of it survived
 * the move. Figures below match what the shop actually does: standard courier
 * is free anywhere in Pakistan, and framed builds ship in reinforced crates.
 */

export const NAV: { label: string; to: string }[] = [
  { label: "Best Sellers", to: "/best-sellers" },
  { label: "Shop", to: "/shop" },
  { label: "Displays", to: "/displays" },
  { label: "Help", to: "/booklets" },
]

/** The dismissible bar above the header. */
export const BANNER = "Free delivery across Pakistan · Framed builds ship in reinforced crates"

/** Hero headline stats. Kept modest and true rather than impressive. */
export const HERO_STATS = [
  { value: "30+", label: "Builds delivered" },
  { value: "1:8", label: "Flagship scale" },
  { value: "3", label: "Ways to own it" },
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
    desc: "Boxed and sealed, built by hand, or mounted in an LED-lit frame — set per item.",
  },
  {
    n: "03",
    title: "We build and deliver",
    desc: "Assembled, inspected and double-boxed, then couriered anywhere in Pakistan.",
  },
]

/** The three-up promise row. Icon names map to lucide-react components. */
export const PROMISES = [
  {
    icon: "Truck",
    title: "Shipped safe",
    body: "Double-boxed with custom foam. Framed builds ship in reinforced crates.",
  },
  {
    icon: "ShieldCheck",
    title: "Inspected builds",
    body: "Every assembled model is checked brick-by-brick before it leaves.",
  },
  {
    icon: "Sparkles",
    title: "Integrated LED",
    body: "Framed editions include a discreet, dimmable LED strip and power lead.",
  },
] as const
