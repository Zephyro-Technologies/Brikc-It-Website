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
    "What brikc.it sells, how we build and deliver it, and every step from choosing a build to it arriving at your door.",
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
    body: "Transfer the amount by bank transfer, JazzCash or Easypaisa to one of the accounts shown, and send us the receipt on WhatsApp with your order number. The button on the confirmation page writes the message for you.",
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
    title: "Go to Rapid Gateway",
    body: "We send you to Rapid Gateway’s secure payment page for the exact total of your order.",
  },
  {
    title: "Pay there",
    body: "Your card or wallet details are entered on Rapid Gateway’s page and never reach us.",
  },
  {
    title: "Confirmed at once",
    body: "Rapid Gateway sends you back to brikc.it and tells us the payment went through, so there is no receipt to send.",
  },
]

export default async function HowItWorksPage() {
  const [settings, displays] = await Promise.all([getSettings(), getDisplays()])
  const hasDisplays = displays.length > 0

  return (
    <PolicyPage
      title="How it works"
      intro="brikc.it sells brick-built scale models of cars, bikes and racing cars to customers across Pakistan. You can buy one boxed to build yourself, or built by us and framed for your wall."
    >
      <Section title="What we do" wide>
        <p>
          We are a small online shop, and everything we sell is listed on this site with its price in rupees. Our
          models are scale builds of cars, bikes and F1-style racing cars. Each one can be bought unassembled, as a kit
          in its box, or assembled by hand by us, and any model can have a plain or LED-lit display frame added so the
          finished build hangs on a wall.
          {hasDisplays && " We also sell frames and desks on their own, by size or finish."} We also offer bundles of
          several builds for one price.
        </p>
        <p>
          We keep our kits in stock, and assemble, frame, pack and dispatch every order ourselves. We sell only online,
          through this site and our Instagram, to people buying for themselves or as a gift.
        </p>
      </Section>

      <Section title="From choosing a build to it arriving" wide>
        <Steps steps={journey(hasDisplays)} />
      </Section>

      <Section title="Paying online by card or wallet" wide>
        <p>
          We are adding online payment through Rapid Gateway, a Pakistani payment
          gateway, so you can pay by debit or credit card or mobile wallet at checkout instead of transferring
          yourself. It will work like this:
        </p>
        <Steps steps={ONLINE_PAYMENT} columns={4} />
        <p>
          The amount is always set by our server from the order itself, never by your browser. Bank transfer, JazzCash
          and Easypaisa stay available alongside it. Refunds for online payments go back to the card or wallet you
          paid with, as our{" "}
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
