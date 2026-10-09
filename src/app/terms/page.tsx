import type { Metadata } from "next"
import Link from "next/link"
import { ContactBand, PolicyPage, Section, policyLink } from "../../components/Policy"
import { BUSINESS } from "../../content/business"
import { getSettings } from "../../lib/shop"

/** A floor under the cache; see the note in src/app/page.tsx. */
export const revalidate = 60

export const metadata: Metadata = {
  title: "Terms & conditions — brikc.it",
  description: "The terms on which brikc.it sells its builds and display frames.",
}

export default async function TermsPage() {
  const settings = await getSettings()

  return (
    <PolicyPage
      title="Terms & conditions"
      intro="These are the terms you agree to when you order from brikc.it. They sit alongside our shipping, refund and privacy policies."
    >
      <Section n={1} title="Who we are">
        <p>
          brikc.it is an online shop in Pakistan selling brick-built scale models of cars, bikes and racing cars, and
          display frames for them
          {BUSINESS.operator ? `, run by ${BUSINESS.operator}` : ""}.
          {BUSINESS.address ? ` Our address is ${BUSINESS.address}.` : ""}
        </p>
      </Section>

      <Section n={2} title="What we sell">
        <p>
          A model can be bought unassembled, in its box, or assembled by us, with an optional display frame, plain or
          LED-lit. Each product&rsquo;s page shows what is included and the price of each option. Photographs show the
          finished build; colours and lighting can look slightly different on your screen.
        </p>
        <p>
          Our models are brick-built and are not made by or connected with the LEGO Group. Names of real vehicles,
          manufacturers or teams are used only to describe what a model depicts.
        </p>
      </Section>

      <Section n={3} title="Prices">
        <p>
          All prices are in Pakistani rupees (PKR). The price you pay is the one confirmed when you place your order: we
          check every price, discount code and stock level again at that moment, so a cart left open in your browser
          cannot hold an old price.
        </p>
        <p>
          Standard delivery is free, and any other delivery charge is shown at checkout before you order. A discount
          code applies to the goods, not to delivery, and can carry its own dates, limits and minimum spend.
        </p>
      </Section>

      <Section n={4} title="Placing an order">
        <p>
          When you place an order you get an order number on screen and by email, with the amount to pay and how to
          pay it. Your order is accepted when we confirm your payment. That is when the contract between us is made
          and the build starts.
        </p>
        <p>
          Stock is set aside when an order is paid, not when it is placed. If two people order the last one, the first
          to pay gets it, and we refund or hold the other order as our{" "}
          <Link href="/refund-policy" className={policyLink}>
            refund policy
          </Link>{" "}
          describes.
        </p>
      </Section>

      <Section n={5} title="Paying">
        <p>
          Orders are paid for in full before they are dispatched. There is no cash on delivery. Today that is by bank
          transfer, JazzCash or Easypaisa, to the accounts shown with your order. We are also adding online payment from
          your bank account or mobile wallet through our payment partner, as explained on{" "}
          <Link href="/how-it-works" className={policyLink}>
            how it works
          </Link>
          .
        </p>
      </Section>

      <Section n={6} title="Delivery, returns and refunds">
        <p>
          Delivery is covered by our{" "}
          <Link href="/shipping-policy" className={policyLink}>
            shipping policy
          </Link>
          , and returns, cancellations and refunds by our{" "}
          <Link href="/refund-policy" className={policyLink}>
            refund policy
          </Link>
          . Neither takes away any right you have under Pakistani consumer law.
        </p>
      </Section>

      <Section n={7} title="Reviews">
        <p>
          If you write a review, you let us publish it on brikc.it with any photos or video you attach. We read every
          review before it appears and may decline one that is abusive, off-topic or not about something you bought.
        </p>
      </Section>

      <Section n={8} title="Using the site">
        <p>
          The photographs, words and design of this site are ours. Please don&rsquo;t copy them for commercial use
          without asking. Assembly manuals are free to download for your own use.
        </p>
      </Section>

      <Section n={9} title="Our responsibility">
        <p>
          We are responsible for delivering what you ordered, as described, and for putting it right when it
          isn&rsquo;t. Models contain small parts and are not suitable for young children. We are not responsible
          for delays caused by events outside our control, such as courier disruption or severe weather, but we will
          tell you and help where we can.
        </p>
      </Section>

      <Section n={10} title="Law and changes">
        <p>
          These terms are governed by the laws of Pakistan. We may update them; the version that applies to your
          order is the one on this page when you placed it.
        </p>
      </Section>

      <ContactBand instagram={settings.instagram} />
    </PolicyPage>
  )
}
