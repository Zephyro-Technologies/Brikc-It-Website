import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"
import { ContactBand, PolicyPage, Section, Steps, policyLink } from "../../components/Policy"
import { getDisplays, getSettings } from "../../lib/shop"

/** A floor under the cache; see the note in src/app/page.tsx. */
export const revalidate = 60

export const metadata: Metadata = {
  title: "How it works — brikc.it",
  description:
    "brikc.it's business model, target customers and operations, the customer journey from browsing to delivery, and how we use our payment gateway.",
}

/**
 * The business model and the customer journey, end to end — what the payment
 * gateway's onboarding asks to see on the site.
 *
 * Every step has to be what the checkout actually does today. The online
 * payment section describes the gateway as coming, because it is: change that
 * section, and step 5, in the same commit that puts it into the checkout.
 */

/** The displays are only offered once there are some, here as in the nav. */
const journey = (hasDisplays: boolean): { title: string; body: ReactNode }[] => [
  {
    title: "Browse",
    body: (
      <>
        Look through the{" "}
        <Link href="/shop" className={policyLink}>
          shop
        </Link>{" "}
        by category or price
        {hasDisplays && (
          <>
            , or the{" "}
            <Link href="/displays" className={policyLink}>
              displays
            </Link>
          </>
        )}
        . Every build has its own page with photographs, a description and the price of each option.
      </>
    ),
  },
  {
    title: "Choose how you want it",
    body: "Pick unassembled (in the box) or assembled by us, and whether to add a plain or LED-lit display frame. The price updates as you choose. Then add it to your cart.",
  },
  {
    title: "Check out",
    body: "Enter your name, email, phone number and delivery address, choose a delivery option and apply a discount code if you have one. The total is worked out on our server from the current prices, so what you see is exactly what you pay.",
  },
  {
    title: "Place the order",
    body: "You get an order number straight away, on screen and by email, together with the amount to pay and how to pay it.",
  },
  {
    title: "Pay",
    body: "Today: transfer the amount by bank transfer, JazzCash or Easypaisa to one of the accounts shown, and send us the receipt on WhatsApp. Once online payment is live: pay online at checkout from your bank account or mobile wallet, with nothing to send afterwards.",
  },
  {
    title: "We confirm",
    body: "We match your payment to the order and confirm on WhatsApp. That is when your order is accepted and stock is set aside for you.",
  },
  {
    title: "We build and pack",
    body: "Kits are packed sealed. Assembled builds are put together by hand and inspected, and framed builds are mounted, lit and checked before they go into a reinforced crate.",
  },
  {
    title: "Delivery",
    body: (
      <>
        A tracked courier brings it to you anywhere in Pakistan, free, and we send you the tracking number. In some
        cities you can have it hand-delivered instead. See the{" "}
        <Link href="/shipping-policy" className={policyLink}>
          shipping policy
        </Link>{" "}
        for timings.
      </>
    ),
  },
  {
    title: "After it arrives",
    body: (
      <>
        Download the assembly manual from{" "}
        <Link href="/guides" className={policyLink}>
          Guides
        </Link>{" "}
        if you are building it yourself. If anything is damaged or missing, tell us within 48 hours; the{" "}
        <Link href="/refund-policy" className={policyLink}>
          refund policy
        </Link>{" "}
        explains what we do about it. You can also review your build.
      </>
    ),
  },
]

const ONLINE_PAYMENT: { title: string; body: ReactNode }[] = [
  { title: "Choose to pay online", body: "At checkout, you choose to pay online and place your order." },
  {
    title: "Go to the payment page",
    body: "We send you to our payment partner’s secure page for the exact total of your order.",
  },
  {
    title: "Pay there",
    body: "You pay from your bank account or mobile wallet on our payment partner’s page. Your login and account details never reach us.",
  },
  {
    title: "Confirmed at once",
    body: "Our payment partner sends you back to brikc.it and tells us the payment went through, so there is no receipt to send.",
  },
]

export default async function HowItWorksPage() {
  const [settings, displays] = await Promise.all([getSettings(), getDisplays()])
  const hasDisplays = displays.length > 0

  return (
    <PolicyPage
      title="How it works"
      intro="Our business model, who we sell to, how we operate, the customer journey from browsing to delivery, and how we will use our payment gateway."
    >
      <Section title="Our business model" wide>
        <p>
          brikc.it is an online retail shop. We sell physical products, brick-built scale models and display frames,
          directly to customers in Pakistan through this website and our Instagram. Every product is listed here with
          photographs, a description and its price in Pakistani rupees, and customers pay for their order before we
          dispatch it. That sale is how the business earns its money: there are no subscriptions, memberships or
          recurring charges.
        </p>
      </Section>

      <Section title="Products we sell">
        <p>
          Scale models of cars, bikes and F1-style racing cars. Each one can be bought unassembled, as a kit in its
          box, or assembled by hand by us, and any model can have a plain or LED-lit display frame added so the
          finished build hangs on a wall. We also offer bundles of several builds for one price.
          {hasDisplays && " Frames and desks are also sold on their own, by size or finish."}
        </p>
      </Section>

      <Section title="Who our customers are">
        <p>
          Individuals across Pakistan: people who collect or enjoy cars, bikes and motorsport, people who like building
          models themselves, and people buying a gift. We sell to the public, one order at a time, and deliver within
          Pakistan only.
        </p>
      </Section>

      <Section title="How we operate" wide>
        <p>
          We keep our kits in stock. When an order is paid, we pack kits sealed, assemble builds by hand and inspect
          them, and fit and check frames, all ourselves. Orders go out by tracked courier, free anywhere in Pakistan, or
          by hand delivery in the towns listed at checkout. We handle questions, returns and refunds ourselves by email,
          phone and WhatsApp, as set out in our{" "}
          <Link href="/shipping-policy" className={policyLink}>
            shipping
          </Link>{" "}
          and{" "}
          <Link href="/refund-policy" className={policyLink}>
            refund
          </Link>{" "}
          policies.
        </p>
      </Section>

      <Section title="Customer journey: from browsing to delivery" wide>
        <Steps steps={journey(hasDisplays)} />
      </Section>

      <Section title="How we will use the payment gateway" wide>
        <p>
          We are integrating a Pakistani payment gateway for one purpose: to collect payment for orders placed on
          brikc.it, at the checkout step. Customers will pay from their bank account or mobile wallet instead of making
          a transfer themselves and sending us the receipt. We don&rsquo;t take card payments. During the customer&rsquo;s payment it works like this:
        </p>
        <Steps steps={ONLINE_PAYMENT} columns={4} />
        <p>
          The amount charged is always the order total set by our server from the order itself, never by the
          customer&rsquo;s browser. The gateway is used only for one-off payments for products on this site: no
          subscriptions, no recurring billing, no payments for anything sold elsewhere. Bank transfer, JazzCash and
          Easypaisa stay available alongside it. Refunds for online payments go back to the bank account or wallet the
          customer paid from, as our{" "}
          <Link href="/refund-policy" className={policyLink}>
            refund policy
          </Link>{" "}
          describes.
        </p>
      </Section>

      <ContactBand instagram={settings.instagram} title="Talk to us" note="Questions before you order, or about one you've placed." />
    </PolicyPage>
  )
}
