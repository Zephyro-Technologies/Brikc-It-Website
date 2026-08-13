import type { Metadata } from "next"
import Link from "next/link"
import { Details, LegalPage, MailLink, Section, UL } from "../../components/legal"
import { BUSINESS } from "../../lib/legal"
import { getSettings } from "../../lib/shop"

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy — brikc.it",
  description:
    "Where brikc.it ships, how long builds take before dispatch, which couriers we use, how delivery is charged and what to do if a parcel is late or damaged.",
}

const A = "text-[#ff6b4a] underline-offset-4 hover:underline"

export default async function ShippingPage() {
  const { leadTimes } = await getSettings()

  return (
    <LegalPage
      current="/shipping"
      title="Shipping &amp; Delivery"
      summary="We ship across Pakistan by tracked courier. Boxed and built orders leave us in a few days; framed pieces are wired and mounted to order, so they take longer."
    >
      <Section n={1} title="Where we ship">
        <p>
          We deliver anywhere in {BUSINESS.country} that our courier partners reach, which is
          effectively every city and most towns. We do not currently ship internationally — if you
          are outside Pakistan and want a piece, write to <MailLink /> and we will tell you honestly
          whether it can be arranged.
        </p>
      </Section>

      <Section n={2} title="How long it takes">
        <p>
          Two things add up: the time we need to prepare your order, and the time the courier needs
          to carry it.
        </p>
        <Details
          rows={[
            ["Boxed", `Dispatched within ${leadTimes.standard} days — picked, checked and sealed.`],
            ["Built", `Dispatched within ${leadTimes.standard} days — assembled by hand, cleaned and inspected.`],
            ["Framed", `Dispatched within ${leadTimes.framed} days — assembled, mounted, wired and tested in its LED frame.`],
            ["Courier transit", "Typically 1–2 days within the same city, 2–5 days elsewhere in Pakistan."],
          ]}
        />
        <p>
          These are working estimates from the day payment clears, not guarantees. An order with
          several pieces ships together once the slowest one is ready — tell us if you would rather
          have it split and we will quote the extra delivery.
        </p>
      </Section>

      <Section n={3} title="Delivery charges">
        <p>
          Delivery is charged separately from the price of the model and depends on where it is going
          and how large and fragile the piece is — a framed build ships in a much bigger, better
          protected box than a boxed set. The exact charge is calculated and shown at checkout before
          you pay, so there is never a surprise afterwards.
        </p>
      </Section>

      <Section n={4} title="Couriers and tracking">
        <p>
          We ship by tracked courier — usually TCS, Leopards, M&amp;P or Call Courier, whichever
          serves your address best. When your parcel is collected we email you the courier&rsquo;s
          name and the tracking number.
        </p>
        <p>
          Please give a phone number the courier can actually reach, and an address where someone can
          receive the parcel during the day. Couriers make a limited number of attempts before
          returning a parcel to us.
        </p>
      </Section>

      <Section n={5} title="When it arrives">
        <p>Models are fragile, so please:</p>
        <UL>
          <li>check the outer box for crushing or tears before you sign for it;</li>
          <li>photograph the packaging if it looks damaged;</li>
          <li>open and check the piece the same day if you can.</li>
        </UL>
        <p>
          If anything is broken, tell us within {BUSINESS.returnWindowDays} days with photographs and
          we will put it right at our cost — see the{" "}
          <Link href="/refunds" className={A}>
            Cancellation, Return &amp; Refund Policy
          </Link>
          .
        </p>
      </Section>

      <Section n={6} title="Delays">
        <p>
          Occasionally a courier runs late, a part we need is held up, or a framed build fails its
          final check and has to be redone. If your order is going to miss its estimate by more than
          a few days we will contact you rather than leave you guessing, and you can wait or cancel
          for a full refund.
        </p>
        <p>
          We are not liable for delays outside our reasonable control, such as courier disruption,
          weather or restrictions imposed by authorities.
        </p>
      </Section>

      <Section n={7} title="Wrong address or failed delivery">
        <p>
          Please check your delivery address carefully before paying — once a parcel has been
          collected we cannot change it. If a parcel is returned to us because the address was wrong
          or nobody could receive it, we will contact you to arrange redelivery at the normal
          delivery charge, or refund the item as set out in the refund policy.
        </p>
      </Section>

      <Section n={8} title="Contact us">
        <p>
          Questions about a delivery in progress: <MailLink /> or {BUSINESS.phone}. Please have your
          order number to hand.
        </p>
      </Section>
    </LegalPage>
  )
}
