/**
 * Who runs the shop and how to reach them — the footer's contact block, and
 * the "who we are" line in the Terms.
 *
 * The payment gateway's onboarding checks these against the documents the
 * business submitted: the address has to match the electricity bill character
 * for character, and the email and phone have to be the ones on the merchant
 * application. So nothing here is a guess. An empty string means "not
 * confirmed yet", and every place that reads this renders nothing for an empty
 * field rather than a placeholder — a footer reading "Address: TBC" is worse
 * than no line at all.
 */
export const BUSINESS = {
  /** The legal name the shop trades under — the registered person or business. */
  operator: "",
  /** Exactly as printed on the utility bill submitted to the gateway. */
  address: "JINNAH ST ZAKRIYA TOWN, BASAN RD, MULTAN",
  email: "orders@brikc.it",
  /** As people dial it, e.g. "0316 5511771". */
  phone: "0316 5511771",
}

/** The date printed under each policy's title. Change it when the words change. */
export const POLICIES_UPDATED = "1 October 2026"

/** The footer's Help column: how to reach us, then the policies. */
export const POLICY_LINKS = [
  { label: "Contact us", to: "/contact" },
  { label: "How it works", to: "/how-it-works" },
  { label: "Shipping policy", to: "/shipping-policy" },
  { label: "Refund policy", to: "/refund-policy" },
  { label: "Terms & conditions", to: "/terms" },
  { label: "Privacy", to: "/privacy" },
]

/** `tel:` wants digits, not the spaced form people read. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`
}
