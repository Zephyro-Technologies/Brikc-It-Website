import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage, MailLink, Section, UL } from "../../components/legal"
import { BUSINESS } from "../../lib/legal"

export const metadata: Metadata = {
  title: "Cancellation, Return & Refund Policy — brikc.it",
  description:
    "How to cancel a brikc.it order, what can be returned, what happens if something arrives damaged, and how and when refunds are paid.",
}

const A = "text-[#ff6b4a] underline-offset-4 hover:underline"
const DAYS = BUSINESS.returnWindowDays

export default function RefundsPage() {
  return (
    <LegalPage
      current="/refunds"
      title="Cancellation, Return &amp; Refund Policy"
      summary={`Cancel free of charge any time before dispatch. Sealed boxed sets can come back within ${DAYS} days. Anything that arrives damaged, faulty or wrong is put right whatever format it is.`}
    >
      <Section n={1} title="Cancelling before dispatch">
        <p>
          You can cancel an order at no cost at any point before it is dispatched. Email{" "}
          <MailLink /> with your order number and we will cancel it and refund you in full.
        </p>
        <p>
          Built and framed pieces are assembled to order, so the sooner you tell us the better — once
          a piece has been dispatched, the return rules in section 2 apply instead.
        </p>
      </Section>

      <Section n={2} title="What can be returned">
        <p>
          <strong className="text-zinc-200">Boxed sets — yes.</strong> An unopened, still-sealed boxed
          set can be returned for any reason within {DAYS} days of delivery, in its original
          packaging and in resaleable condition. Once the seal is broken it can no longer be
          returned for a change of mind.
        </p>
        <p>
          <strong className="text-zinc-200">Built and framed pieces — no, unless something is
          wrong.</strong> These are assembled and, for framed pieces, mounted and wired by hand
          specifically for your order. Because they are made to order they cannot be returned simply
          because you have changed your mind or ordered the wrong model.
        </p>
        <p>
          This does not affect your rights below if an item arrives damaged, faulty, or is not what
          you ordered — those apply to every format, including framed.
        </p>
      </Section>

      <Section n={3} title="If something arrives damaged, faulty or wrong">
        <p>
          Please open and check your parcel as soon as it arrives. If a model is broken in transit,
          has a genuine fault, or is not the item or format you ordered, contact us as soon as you
          can and in any case within <strong className="text-zinc-200">{DAYS} days of delivery</strong>
          , with:
        </p>
        <UL>
          <li>your order number;</li>
          <li>photographs of the damage or fault;</li>
          <li>a photograph of the outer packaging, if the parcel itself was damaged.</li>
        </UL>
        <p>
          We will repair it, replace it, or refund it in full — including what you paid for delivery
          — and we cover the cost of sending it back. Which of the three we offer depends on what is
          practical for that piece; for a one-off framed build a repair or refund is often faster
          than remaking it, and we will agree the route with you first.
        </p>
        <p>
          A small variation in the placement of a piece, the finish of an assembled model, or the
          exact tone of an LED strip is a normal feature of hand-built work rather than a fault.
        </p>
      </Section>

      <Section n={4} title="How to start a return">
        <p>
          Email <MailLink /> with your order number and what you would like to do.{" "}
          <strong className="text-zinc-200">Please wait for us to confirm before sending anything
          back</strong> — we will give you the return address and, where we are covering it, arrange
          the courier. Parcels sent back without being agreed first may be refused.
        </p>
        <p>
          Pack the item as it arrived. Models are fragile, and a return damaged on its way back to us
          can only be refunded for what arrives in resaleable condition.
        </p>
      </Section>

      <Section n={5} title="Who pays for return postage">
        <UL>
          <li>
            <strong className="text-zinc-200">Damaged, faulty or wrong item</strong> — we pay, and you
            are refunded the original delivery charge too.
          </li>
          <li>
            <strong className="text-zinc-200">Change of mind on a sealed boxed set</strong> — you pay
            the return postage, and the original delivery charge is not refunded.
          </li>
        </UL>
      </Section>

      <Section n={6} title="How and when you are refunded">
        <p>
          Refunds are issued to the original payment method through Safepay. We process a refund
          within <strong className="text-zinc-200">3 working days</strong> of cancelling the order,
          or of receiving and checking a returned item. Your bank then takes its own time to post it
          to your account, usually a further{" "}
          <strong className="text-zinc-200">5 to 10 working days</strong>.
        </p>
        <p>
          We cannot refund to a different card or account from the one used to pay. Cash refunds are
          not offered.
        </p>
      </Section>

      <Section n={7} title="Exchanges">
        <p>
          We do not run a direct exchange process. If you want a different model or format, return
          the original under this policy where it qualifies and place a new order — that way the new
          piece enters the build queue straight away rather than waiting on the return.
        </p>
      </Section>

      <Section n={8} title="Undelivered and refused parcels">
        <p>
          If a parcel comes back to us because the address was wrong, nobody was available after the
          courier&rsquo;s attempts, or delivery was refused, we will refund the item but not the
          delivery charge, and any cost the courier charges us for the return is deducted. We will
          always try to reach you before a parcel is sent back.
        </p>
      </Section>

      <Section n={9} title="Contact us">
        <p>
          Returns, refunds and damage claims: <MailLink /> or {BUSINESS.phone}. This policy sits
          alongside our{" "}
          <Link href="/terms" className={A}>
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link href="/shipping" className={A}>
            Shipping &amp; Delivery Policy
          </Link>
          , and does not affect your statutory rights under Pakistani consumer law.
        </p>
      </Section>
    </LegalPage>
  )
}
