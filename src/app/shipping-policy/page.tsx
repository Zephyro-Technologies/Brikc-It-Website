import type { Metadata } from "next"
import Link from "next/link"
import { ContactBand, Highlights, PolicyPage, Section, policyLink } from "../../components/Policy"
import { getDeliveryOptions, getSettings } from "../../lib/shop"
import { money } from "../../lib/money"

/** A floor under the cache; see the note in src/app/page.tsx. */
export const revalidate = 60

export const metadata: Metadata = {
  title: "Shipping policy — brikc.it",
  description: "How and when brikc.it orders are built, packed and delivered across Pakistan.",
}

/**
 * Lead times and the hand-delivery towns are read from settings rather than
 * written here, so this page cannot quote a different number from the product
 * pages and the checkout. The courier transit times are the shop's own
 * estimate and are the one figure here that lives in the copy.
 */
/**
 * The admin stores a lead time as typed — "5-7" as often as "5–7 days" — and a
 * sentence needs the unit. A bare number or range gets "days"; anything with
 * words in it is left as written.
 */
function withDays(leadTime: string): string {
  const t = leadTime.trim()
  return /^\d+(\s*[-–]\s*\d+)?$/.test(t) ? `${t} days` : t
}

export default async function ShippingPolicyPage() {
  const [settings, delivery] = await Promise.all([getSettings(), getDeliveryOptions()])
  const standard = withDays(settings.leadTimes.standard)
  const framed = withDays(settings.leadTimes.framed)
  const teamhq = delivery.find((d) => d.id === "teamhq")

  return (
    <PolicyPage
      title="Shipping policy"
      intro="We deliver anywhere in Pakistan, and standard delivery is free. Every order is built or packed to order once its payment has been confirmed."
    >
      <Highlights
        items={[
          { figure: "Free", title: "Delivery anywhere in Pakistan", body: "Standard courier delivery costs nothing, whatever you order." },
          ...(standard
            ? [{ figure: standard, title: "To dispatch", body: "Counted from the day we confirm your payment." }]
            : []),
          { figure: "Tracked", title: "Every parcel", body: "We send you the tracking number as soon as it ships." },
        ]}
      />

      <Section title="When your order leaves us">
        <p>
          We start on an order once its payment is confirmed, never before, and count the time from that day.
          {standard && ` Kits, assembled builds and displays are dispatched within ${standard}.`}
          {framed && ` Anything with a display frame takes ${framed}, because the frame is fitted and checked by hand.`}
        </p>
      </Section>

      <Section title="Standard delivery is free">
        <p>
          A tracked courier delivers to any address in Pakistan at no charge. Once your parcel is handed over, we send
          you the tracking number on WhatsApp or by email. Delivery usually takes 2 to 4 working days after dispatch in
          major cities and 4 to 7 working days elsewhere. Remote areas, including Gilgit-Baltistan and Azad Jammu and
          Kashmir, can take longer.
        </p>
      </Section>

      {teamhq && (
        <Section title="Hand delivery" wide>
          <p>
            In {teamhq.cities.join(" and ")} we can bring your order to your door in person instead, for{" "}
            {money(teamhq.fee)}. Choose it at checkout and we&rsquo;ll arrange a time with you on WhatsApp.
          </p>
        </Section>
      )}

      <Section title="Packing">
        <p>
          Assembled builds are inspected and double-boxed. Framed builds ship in reinforced crates. Kits ship sealed,
          as they came.
        </p>
      </Section>

      <Section title="Payment before dispatch">
        <p>
          We don&rsquo;t offer cash on delivery. Orders are paid for before they are dispatched, as explained on{" "}
          <Link href="/how-it-works" className={policyLink}>
            how it works
          </Link>
          .
        </p>
      </Section>

      <Section title="If something goes wrong in transit" wide>
        <p>If a parcel is lost on its way to you, we send a replacement or refund you in full, at our cost.</p>
        <p>
          If it arrives damaged, tell us within 48 hours, as set out in our{" "}
          <Link href="/refund-policy" className={policyLink}>
            refund policy
          </Link>
          .
        </p>
        <p>
          If nobody is there to receive it, the courier tries again and then returns the parcel to us. You can have it
          sent again at the courier&rsquo;s cost to you, or get a refund less the courier&rsquo;s charges both ways.
        </p>
      </Section>

      <ContactBand instagram={settings.instagram} title="Questions about a delivery?" />
    </PolicyPage>
  )
}
