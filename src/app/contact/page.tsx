import type { Metadata } from "next"
import Link from "next/link"
import { ContactBand, PolicyPage, Section, policyLink } from "../../components/Policy"
import { BUSINESS, telHref } from "../../content/business"
import { getSettings } from "../../lib/shop"

/** A floor under the cache; see the note in src/app/page.tsx. */
export const revalidate = 60

export const metadata: Metadata = {
  title: "Contact us — brikc.it",
  description: "Email, phone, address and Instagram for brikc.it, and what to include about an order.",
}

/**
 * The Contact Us page the payment gateway's screening asks for. Every channel
 * comes from `BUSINESS` and settings, the same as the footer, so the two can
 * never list different details.
 */
export default async function ContactPage() {
  const settings = await getSettings()
  const handle = settings.instagram.replace(/^@/, "")

  return (
    <PolicyPage
      title="Contact us"
      intro="Questions before you order, help with one you've placed, or a problem with a delivery: here is how to reach us."
    >
      <Section title="Email">
        {BUSINESS.email ? (
          <p>
            <a href={`mailto:${BUSINESS.email}`} className={policyLink}>
              {BUSINESS.email}
            </a>
            <br />
            For anything about an order, including returns and refunds. We reply within one working day.
          </p>
        ) : (
          <p>Email us through Instagram for now.</p>
        )}
      </Section>

      <Section title="Phone">
        {BUSINESS.phone ? (
          <p>
            <a href={telHref(BUSINESS.phone)} className={policyLink}>
              {BUSINESS.phone}
            </a>
            <br />
            Call or message us. Payment receipts are sent on WhatsApp from your order&rsquo;s confirmation page.
          </p>
        ) : (
          <p>Message us on Instagram.</p>
        )}
      </Section>

      <Section title="Business address">
        {BUSINESS.address && <address className="not-italic">{BUSINESS.address}</address>}
        {BUSINESS.operator && <p>brikc.it is run by {BUSINESS.operator}.</p>}
        <p>We sell online only, through this site and Instagram.</p>
      </Section>

      <Section title="Instagram">
        {handle && (
          <p>
            <a href={`https://instagram.com/${handle}`} target="_blank" rel="noreferrer" className={policyLink}>
              @{handle}
            </a>
            <br />
            The quickest way to ask about a build before you order.
          </p>
        )}
      </Section>

      <Section title="About an order" wide>
        <p>
          Include your order number (it is on your confirmation page and in your order email) and what you need
          help with. For damaged or missing pieces, add photos, and an unboxing video if you have one; our{" "}
          <Link href="/refund-policy" className={policyLink}>
            refund policy
          </Link>{" "}
          explains what happens next. Delivery times are on the{" "}
          <Link href="/shipping-policy" className={policyLink}>
            shipping policy
          </Link>
          .
        </p>
      </Section>

      <ContactBand instagram={settings.instagram} title="Get in touch" note="Whichever is easiest for you." />
    </PolicyPage>
  )
}
