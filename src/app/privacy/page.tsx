import type { Metadata } from "next"
import Link from "next/link"
import { Details, LegalPage, MailLink, Section, UL } from "../../components/legal"
import { BUSINESS, fullAddress } from "../../lib/legal"

export const metadata: Metadata = {
  title: "Privacy Policy — brikc.it",
  description:
    "What personal information brikc.it collects when you place an order, why we hold it, who else sees it, and how to have it removed.",
}

export default function PrivacyPage() {
  return (
    <LegalPage
      current="/privacy"
      title="Privacy Policy"
      summary="We collect the details needed to take payment and get a parcel to your door, and nothing beyond that. We do not sell your information."
    >
      <Section n={1} title="Who is responsible for your data">
        <p>
          brikc.it is owned and operated by {BUSINESS.ownerName}, a sole proprietorship based in{" "}
          {BUSINESS.country}. When you buy from this site, {BUSINESS.ownerName} is the party
          responsible for the personal information you provide.
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

      <Section n={2} title="What we collect">
        <p>Only what an order actually requires:</p>
        <UL>
          <li>
            <strong className="text-zinc-200">Your name, email address and phone number</strong> — so
            we can confirm the order, ask about a build if something is unclear, and so the courier
            can reach you.
          </li>
          <li>
            <strong className="text-zinc-200">Your delivery address</strong> — passed to the courier
            and printed on the label.
          </li>
          <li>
            <strong className="text-zinc-200">Your order</strong> — which models you bought, in which
            format, at what price, and its delivery status.
          </li>
          <li>
            <strong className="text-zinc-200">Anything you write to us</strong> — emails and Instagram
            messages, kept so we can follow up on a query or a return.
          </li>
        </UL>
        <p>
          There are no customer accounts on this site, so there is no password for us to store. Your
          cart is kept in your own browser and is never sent to us until you check out.
        </p>
        <p>
          <strong className="text-zinc-200">We never see your card details.</strong> Card and wallet
          payments are taken by Safepay on their own secure pages. Your card number, expiry and CVV
          go to Safepay and their banking partners, never to brikc.it. All we receive back is whether
          the payment succeeded and a reference for it.
        </p>
      </Section>

      <Section n={3} title="Why we hold it">
        <p>We use your information to:</p>
        <UL>
          <li>take payment for, prepare, and deliver your order;</li>
          <li>send you order confirmations, dispatch notices and tracking;</li>
          <li>handle returns, refunds, damage claims and questions;</li>
          <li>keep the sales records we are required to keep for tax purposes;</li>
          <li>detect and prevent fraudulent orders.</li>
        </UL>
        <p>
          We do not send marketing emails unless you have asked us to, and we do not build
          advertising profiles.
        </p>
      </Section>

      <Section n={4} title="Who else handles it">
        <p>
          We share the minimum necessary with the services that make the shop work. None of them are
          permitted to use your information for their own purposes.
        </p>
        <Details
          rows={[
            ["Safepay", "Processes card and wallet payments and holds the payment record. We pass them the order amount and your contact details; they hold the card data."],
            ["Courier", "The courier carrying your parcel (such as TCS, Leopards, M&P or Call Courier) receives your name, address and phone number in order to deliver it."],
            ["Supabase", "Hosts the database that stores the catalogue and order records."],
            ["Cloudflare", "Serves this website and protects it from attack and abuse."],
          ]}
        />
        <p>
          Some of these providers store data on servers outside Pakistan. We may also disclose
          information where the law requires it, or to establish or defend a legal claim.
        </p>
        <p>We do not sell, rent or trade your personal information to anyone.</p>
      </Section>

      <Section n={5} title="Cookies">
        <p>
          This site sets no advertising cookies and runs no third-party analytics or tracking
          scripts. Your cart is stored locally in your own browser so it survives a page reload.
          Cloudflare may set essential cookies to keep the site secure and available, and Safepay
          sets its own cookies on its payment pages, governed by Safepay&rsquo;s privacy policy.
        </p>
      </Section>

      <Section n={6} title="How long we keep it">
        <p>
          Order records are kept for as long as we need them for accounting, tax and warranty
          purposes. Correspondence is kept while it is useful for supporting you and then deleted. If
          you ask us to erase your details and we are not required to keep them, we will.
        </p>
      </Section>

      <Section n={7} title="Your choices">
        <p>You can ask us at any time to:</p>
        <UL>
          <li>tell you what information we hold about you;</li>
          <li>correct anything that is wrong;</li>
          <li>delete your details, where we are not obliged to keep them;</li>
          <li>stop contacting you other than about an order in progress.</li>
        </UL>
        <p>
          Email <MailLink /> from the address you used to order and we will respond within 30 days.
          We may need to confirm your identity before making changes.
        </p>
      </Section>

      <Section n={8} title="Security">
        <p>
          The site is served over HTTPS, order data sits behind authentication and row-level access
          rules, and only the shop owner can view orders. No system is perfectly secure, but keeping
          card data entirely out of our hands — with Safepay — removes the most sensitive information
          from the equation altogether.
        </p>
      </Section>

      <Section n={9} title="Children">
        <p>
          This shop is intended for adults. We do not knowingly collect information from children
          under 18. If you believe a child has given us their details, contact us and we will remove
          them.
        </p>
      </Section>

      <Section n={10} title="Changes to this policy">
        <p>
          If we change how we handle your information we will update this page and change the date at
          the top. Continuing to use the site after a change means you accept the updated policy.
        </p>
      </Section>

      <Section n={11} title="Contact us">
        <p>
          Questions about privacy, or a request about your data, go to <MailLink /> or{" "}
          {BUSINESS.phone}. See also our{" "}
          <Link href="/terms" className="text-[#ff6b4a] underline-offset-4 hover:underline">
            Terms &amp; Conditions
          </Link>
          .
        </p>
      </Section>
    </LegalPage>
  )
}
