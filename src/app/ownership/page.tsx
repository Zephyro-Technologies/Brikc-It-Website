import type { Metadata } from "next"
import Link from "next/link"
import { Details, LegalPage, MailLink, Section } from "../../components/legal"
import { BUSINESS, fullAddress } from "../../lib/legal"

export const metadata: Metadata = {
  title: "Ownership Statement — brikc.it",
  description:
    "Who owns and operates brikc.it: the legal owner of the business, the registered address, contact details, and who processes payments made through this site.",
}

const A = "text-[#ff6b4a] underline-offset-4 hover:underline"

export default function OwnershipPage() {
  return (
    <LegalPage
      current="/ownership"
      title="Ownership Statement"
      summary="A plain statement of who stands behind this shop — the person you are buying from, where they are, and how to reach them."
    >
      <Section n={1} title="Who owns and operates this website">
        <p>
          The website at <strong className="text-zinc-200">https://brikc.it</strong>, and the
          business trading as <strong className="text-zinc-200">{BUSINESS.storeName}</strong>, are
          owned and operated by <strong className="text-zinc-200">{BUSINESS.ownerName}</strong>, a
          sole proprietorship established in {BUSINESS.country}.
        </p>
        <p>
          {BUSINESS.ownerName} is the sole owner of the business, is solely responsible for every
          order placed through this site, and is the merchant of record for every payment taken
          through it. There is no other party, parent company or intermediary involved in the sale.
        </p>
      </Section>

      <Section n={2} title="Business details">
        <Details
          rows={[
            ["Legal owner", BUSINESS.ownerName],
            ["Trading name", BUSINESS.storeName],
            ["Business type", `Sole proprietorship, ${BUSINESS.country}`],
            ["Website", "https://brikc.it"],
            ["Address", fullAddress],
            ["Email", <MailLink key="e" />],
            ["Phone", BUSINESS.phone],
            [
              "Instagram",
              <a
                key="i"
                href={`https://instagram.com/${BUSINESS.instagram}`}
                target="_blank"
                rel="noreferrer"
                className={A}
              >
                @{BUSINESS.instagram}
              </a>,
            ],
          ]}
        />
      </Section>

      <Section n={3} title="What we sell and who makes it">
        <p>
          brikc.it sells collector-scale brick models — cars, bikes, Formula 1 machines and collector
          sets — either boxed and unbuilt, assembled by hand, or assembled and mounted in an LED-lit
          display frame. Building, framing, packing and dispatch are all carried out by us in
          Pakistan.
        </p>
        <p>
          LEGO&reg; is a trademark of the LEGO Group, which does not sponsor, authorise or endorse
          this site. We are not affiliated with the LEGO Group, nor with any vehicle manufacturer,
          racing team or championship whose car or livery a model may resemble. Such names are used
          descriptively, to identify the subject of a build.
        </p>
      </Section>

      <Section n={4} title="Payments">
        <p>
          Payments made on this site are processed by <strong className="text-zinc-200">Safepay</strong>
          , a licensed payment processor in Pakistan. Card details are entered on Safepay&rsquo;s
          secure pages and are never seen or stored by brikc.it. Charges appear on your statement
          against {BUSINESS.storeName}.
        </p>
        <p>
          Funds are settled to a bank account held in the name of {BUSINESS.ownerName}, the owner of
          this business.
        </p>
      </Section>

      <Section n={5} title="Intellectual property">
        <p>
          The brikc.it name and logo, the design of this website, and all photography and written
          content on it are the property of {BUSINESS.ownerName} unless stated otherwise. They may
          not be copied, reproduced or used commercially without written permission.
        </p>
      </Section>

      <Section n={6} title="Contact and accountability">
        <p>
          Any question, complaint or legal notice concerning this website or an order placed on it
          should go to <MailLink /> or {BUSINESS.phone}, or by post to the address above. We aim to
          answer within one working day.
        </p>
        <p>
          This statement should be read with our{" "}
          <Link href="/terms" className={A}>
            Terms &amp; Conditions
          </Link>
          ,{" "}
          <Link href="/privacy" className={A}>
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/refunds" className={A}>
            Cancellation, Return &amp; Refund Policy
          </Link>
          .
        </p>
      </Section>
    </LegalPage>
  )
}
