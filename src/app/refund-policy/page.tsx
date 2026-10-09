import type { Metadata } from "next"
import { ContactBand, Highlights, PolicyPage, Section, Steps } from "../../components/Policy"
import { getSettings } from "../../lib/shop"

/** A floor under the cache; see the note in src/app/page.tsx. */
export const revalidate = 60

export const metadata: Metadata = {
  title: "Refund & return policy — brikc.it",
  description: "What you can return to brikc.it, how to claim a refund or replacement, and how long it takes.",
}

export default async function RefundPolicyPage() {
  const settings = await getSettings()

  return (
    <PolicyPage
      title="Refund & return policy"
      intro="If something arrives damaged, wrong or incomplete, we put it right at our cost. If you change your mind, a sealed kit can come back within 7 days."
    >
      <Highlights
        items={[
          { figure: "48 hrs", title: "To report damage", body: "Tell us within 48 hours of delivery and we put it right at our cost." },
          { figure: "7 days", title: "To return a sealed kit", body: "Changed your mind? An unopened kit can come back within 7 days." },
          { figure: "3 days", title: "To send your refund", body: "Working days, once a claim is agreed or a return reaches us." },
        ]}
      />

      <Section title="Damaged, wrong or missing pieces">
        <p>
          Tell us within 48 hours of delivery and quote your order number. Send photos of the damage or of what is
          missing, and an unboxing video if you took one, since it settles most claims straight away.
        </p>
        <p>
          If pieces are missing, we send them. If the item is damaged or wrong, we repair or replace it and collect the
          original if we need it back. If we can do neither, we refund you in full. None of this costs you anything.
        </p>
      </Section>

      <Section title="Changed your mind">
        <p>
          Unassembled kits can be returned within 7 days of delivery if they are still sealed and unopened, in their
          original packaging. Displays and desks can be returned within 7 days if they are unused and undamaged, in
          their original packaging.
        </p>
        <p>
          Assembled and framed builds are built to order for you, so they can&rsquo;t be returned because you changed
          your mind, though they are fully covered if they arrive damaged or wrong. Opened kits can&rsquo;t be returned
          unless they are faulty or incomplete.
        </p>
        <p>
          For a change-of-mind return you pay the courier to send it back, and delivery charges are not refunded.
        </p>
      </Section>

      <Section title="Cancelling an order">
        <p>
          Before you pay, you can cancel at any time. Just tell us, or don&rsquo;t pay, and nothing is owed.
        </p>
        <p>
          After you pay and before we dispatch, kits, displays and desks are refunded in full. Assembled and framed
          builds are refunded in full until we have started building them.
        </p>
        <p>Once an order has been dispatched, cancelling it is treated as a return under the rules above.</p>
        <p>
          If we can&rsquo;t fulfil an order you have paid for, for example because the last one was sold to someone else
          first, we tell you straight away and refund you in full, or hold your order until more arrive if you prefer.
        </p>
      </Section>


      <Section title="How refunds are paid">
        <p>
          Refunds go back the way you paid. A payment by bank transfer, JazzCash or Easypaisa, or online through
          our payment partner, is refunded by transfer to an account in your name. We send a refund within 3 working days of agreeing it, and your bank or wallet
          may take a few more days to show it.
        </p>
        <p>
          Delivery is free, so there is usually nothing else to refund. A hand-delivery fee is refunded only when the
          order is cancelled before it goes out, or when the fault is ours.
        </p>
      </Section>

      <Section title="How to claim" wide>
        <Steps
          columns={4}
          steps={[
            { title: "Tell us", body: "Contact us with your order number and what has gone wrong, using the details below." },
            { title: "We reply", body: "Within one working day, and we tell you whether we need the item back." },
            { title: "Send it back", body: "If we do, we tell you how to send it, or arrange collection when the fault is ours." },
            { title: "Put right", body: "We send the replacement or refund once the claim is agreed, or once the return reaches us." },
          ]}
        />
      </Section>

      <ContactBand
        instagram={settings.instagram}
        title="Need to make a claim?"
        note="Get in touch with your order number and what has gone wrong."
      />
    </PolicyPage>
  )
}
