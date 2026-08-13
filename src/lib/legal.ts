/**
 * Business facts used across the policy pages.
 *
 * These are legal statements on a live site that a payment processor reads, so
 * everything here must be true and must match what was entered in Safepay's
 * Business Details — a mismatch between the name here and the name on the
 * merchant account is a common reason verification is rejected.
 *
 * Anything still wrapped in «» has to be filled in before these pages go live.
 */

export const BUSINESS = {
  storeName: "brikc.it",

  /** Sole proprietor's full legal name, exactly as on the CNIC. */
  ownerName: "«FULL LEGAL NAME AS ON CNIC»",

  /** Street address of the business. Shown on the Ownership Statement. */
  addressLine: "«STREET ADDRESS»",
  city: "«CITY»",
  postcode: "«POSTCODE»",
  country: "Pakistan",

  email: "orders@brikc.it",
  /** Support number. Processors expect a reachable phone, not just email. */
  phone: "«+92 3XX XXXXXXX»",
  instagram: "brikc.it",

  /** Courts named in the governing-law clause. */
  jurisdictionCity: "«CITY»",

  /** Days from delivery to raise a return or report damage. */
  returnWindowDays: 7,

  /** Shown at the top of every policy page. */
  lastUpdated: "12 August 2026",
} as const

/** True once every «placeholder» above has been replaced. */
export const businessDetailsComplete = !Object.values(BUSINESS).some(
  (v) => typeof v === "string" && v.includes("«"),
)

/**
 * The policy pages Safepay requires before it will enable live payments, plus
 * shipping. Kept here rather than beside the components so the footer — a
 * client component — can link to them without pulling the pages into the
 * browser bundle.
 */
export const POLICIES = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/refunds", label: "Returns & Refunds" },
  { href: "/shipping", label: "Shipping & Delivery" },
  { href: "/ownership", label: "Ownership" },
]

export const fullAddress = [
  BUSINESS.addressLine,
  BUSINESS.city,
  BUSINESS.postcode,
  BUSINESS.country,
]
  .filter(Boolean)
  .join(", ")
