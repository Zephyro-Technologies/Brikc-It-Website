import type { Metadata } from "next"
import Link from "next/link"
import { Details, LegalPage, MailLink, Section, UL } from "../../components/legal"
import { BUSINESS, fullAddress } from "../../lib/legal"
import { getSettings } from "../../lib/shop"

export const metadata: Metadata = {
  title: "Terms & Conditions — brikc.it",
  description:
    "The terms you agree to when you order a model from brikc.it: pricing, order acceptance, build and dispatch times, payment, liability and governing law.",
}

const A = "text-[#ff6b4a] underline-offset-4 hover:underline"

export default async function TermsPage() {
  // Build times come from the same store settings the shop pages use, so this
  // page can't quietly drift out of date when they're changed in the admin.
  const { leadTimes } = await getSettings()

  return (
    <LegalPage
      current="/terms"
      title="Terms &amp; Conditions"
      summary="The agreement between you and brikc.it when you order. Please read it before you buy — placing an order means you accept these terms."
    >
      <Section n={1} title="Who you are dealing with">
        <p>
          This website, brikc.it, is owned and operated by {BUSINESS.ownerName}, a sole
          proprietorship based in {BUSINESS.country} (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
          &ldquo;brikc.it&rdquo;). These terms apply to every order placed through this site.
        </p>
        <Details
          rows={[
            ["Business", `${BUSINESS.ownerName}, trading as ${BUSINESS.storeName}`],
            ["Address", fullAddress],
            ["Email", <MailLink key="e" />],
            ["Phone", BUSINESS.phone],
          ]}
        />
      </Section>

      <Section n={2} title="What we sell">
        <p>
          We sell collector-scale brick models — cars, bikes, Formula 1 machines and collector sets —
          in three formats:
        </p>
        <UL>
          <li>
            <strong className="text-zinc-200">Boxed</strong> — the set sealed and unbuilt, for you to
            assemble yourself.
          </li>
          <li>
            <strong className="text-zinc-200">Built</strong> — assembled by hand, cleaned and
            inspected before it ships.
          </li>
          <li>
            <strong className="text-zinc-200">Framed</strong> — assembled and mounted in an LED-lit
            display frame, made to order.
          </li>
        </UL>
        <p>
          Not every model is offered in every format; the formats available are shown on each product
          page. Built and framed pieces are assembled by hand, so small variations in placement,
          finish and the exact tone of a lighting strip are normal and are not defects.
        </p>
        <p>
          <strong className="text-zinc-200">Trademark notice.</strong> LEGO&reg; is a trademark of the
          LEGO Group, which does not sponsor, authorise or endorse this site. We are not affiliated
          with the LEGO Group, nor with any vehicle manufacturer, racing team or championship whose
          car or livery a model may resemble. Team and model names are used descriptively to identify
          the subject of a build only.
        </p>
      </Section>

      <Section n={3} title="Prices">
        <p>
          All prices are shown in Pakistani Rupees (PKR). The price on a product page is the price
          for the boxed format; built and framed formats cost more, and the total for the format you
          choose is shown before you add it to the cart.
        </p>
        <p>
          Delivery is charged separately and is shown at checkout before you pay. We may change
          prices at any time, but never after we have accepted your order.
        </p>
        <p>
          We try hard to keep prices and product details accurate. If a genuine error means an item
          was listed at the wrong price, we will contact you before doing anything else, and you may
          confirm the order at the correct price or cancel it for a full refund.
        </p>
      </Section>

      <Section n={4} title="Placing an order">
        <p>
          Adding something to your cart and paying is an offer to buy. A contract is formed only when
          we confirm your order by email. Until then we may decline an order — for example if an item
          has sold out, if we cannot verify the payment or delivery address, or if we suspect fraud.
          If we decline, we refund you in full.
        </p>
        <p>
          Please check that your name, address and phone number are correct before paying. We are not
          able to correct a delivery address once a parcel has left us.
        </p>
      </Section>

      <Section n={5} title="Making and dispatching your order">
        <p>
          Boxed and built orders are normally dispatched within{" "}
          <strong className="text-zinc-200">{leadTimes.standard} days</strong>. Framed pieces are
          assembled and mounted to order and are normally dispatched within{" "}
          <strong className="text-zinc-200">{leadTimes.framed} days</strong>. Courier transit time is
          on top of that.
        </p>
        <p>
          These are working estimates, not guarantees. If something is going to take materially
          longer we will tell you, and you may cancel and be refunded in full rather than wait. Full
          details are in our{" "}
          <Link href="/shipping" className={A}>
            Shipping &amp; Delivery Policy
          </Link>
          .
        </p>
      </Section>

      <Section n={6} title="Payment">
        <p>
          Payments are processed by <strong className="text-zinc-200">Safepay</strong>, a licensed
          Pakistani payment processor. Your card details are entered on Safepay&rsquo;s secure pages
          and are never seen or stored by brikc.it. Using their service is also subject to
          Safepay&rsquo;s own terms.
        </p>
        <p>
          Orders are paid in full at the time of ordering. We begin building only once payment has
          cleared. Ownership of an item passes to you when it has been paid for in full and
          dispatched.
        </p>
      </Section>

      <Section n={7} title="Cancellation, returns and refunds">
        <p>
          You can cancel before dispatch, and sealed boxed sets can be returned within{" "}
          {BUSINESS.returnWindowDays} days of delivery. Built and framed pieces are made to order and
          cannot be returned simply because you have changed your mind — but anything that arrives
          damaged, faulty or not as ordered will be put right whatever its format.
        </p>
        <p>
          The full rules, including how to raise a claim and who pays return postage, are set out in
          our{" "}
          <Link href="/refunds" className={A}>
            Cancellation, Return &amp; Refund Policy
          </Link>
          , which forms part of these terms.
        </p>
      </Section>

      <Section n={8} title="Photography and descriptions">
        <p>
          Product photographs are of the actual models we sell, but screens vary and lighting in a
          photograph is not a promise about lighting in your room. Piece counts, scales and
          dimensions are given in good faith and may be approximate. Colours, packaging and minor
          details can change between production runs.
        </p>
      </Section>

      <Section n={9} title="Using this site">
        <p>You agree not to:</p>
        <UL>
          <li>place orders fraudulently, or using a payment method that is not yours;</li>
          <li>copy our photographs, text or branding for your own commercial use;</li>
          <li>attempt to disrupt, probe or gain unauthorised access to the site;</li>
          <li>scrape the catalogue by automated means.</li>
        </UL>
        <p>
          The design, photography, text, logo and branding on this site belong to us and may not be
          reproduced without written permission. See our{" "}
          <Link href="/ownership" className={A}>
            Ownership Statement
          </Link>
          .
        </p>
      </Section>

      <Section n={10} title="Our responsibility to you">
        <p>
          We are responsible for supplying what you ordered, in the condition described. If we fail
          to do that, we will repair, replace or refund it.
        </p>
        <p>
          Beyond that, and to the extent the law allows, we are not liable for indirect or
          consequential losses — such as lost profit, lost opportunity, or the cost of an event a
          delivery was intended for. Our total liability for any order will not exceed the amount you
          paid for it. Nothing here limits liability for death or personal injury caused by our
          negligence, or for fraud, or any other liability that cannot lawfully be excluded.
        </p>
        <p>
          These are display models and collectors&rsquo; items, not toys for small children. Framed
          pieces contain low-voltage LED lighting intended for indoor domestic use only; please keep
          them dry and do not modify the wiring.
        </p>
      </Section>

      <Section n={11} title="Events outside our control">
        <p>
          We are not liable for delays or failures caused by events beyond our reasonable control —
          courier disruption, customs, strikes, power or network outages, natural events, or
          restrictions imposed by authorities. If such an event causes a serious delay you may cancel
          an undispatched order and be refunded in full.
        </p>
      </Section>

      <Section n={12} title="Governing law">
        <p>
          These terms are governed by the laws of the Islamic Republic of Pakistan, and the courts of{" "}
          {BUSINESS.jurisdictionCity} have exclusive jurisdiction over any dispute arising from them.
          If any part of these terms is found unenforceable, the rest continues to apply.
        </p>
      </Section>

      <Section n={13} title="Changes to these terms">
        <p>
          We may update these terms; the version in force is the one published here on the date you
          place your order, and the date it was last changed is shown at the top of this page.
        </p>
      </Section>

      <Section n={14} title="Contact us">
        <p>
          Email <MailLink /> or call {BUSINESS.phone}. We reply to order queries as quickly as we can,
          normally within one working day.
        </p>
      </Section>
    </LegalPage>
  )
}
