import type { Metadata } from "next"
import { PolicyPage, Section, policyLink } from "../../components/Policy"

export const metadata: Metadata = {
  title: "Privacy — brikc.it",
  description: "What brikc.it collects when you order, who else receives it, and how Meta's ads use it.",
}

/**
 * The notice Meta's Business Tools Terms ask for on every page the pixel runs
 * on — linked from the footer, so it is one tap from each of them.
 *
 * Every sentence has to be true of what the code does (CLAUDE.md, "Copy must be
 * true"). Change what is collected or who receives it — the checkout's fields,
 * src/lib/pixel.ts, private.tell_meta_paid() in the admin's migrations — and
 * this page changes in the same commit.
 */

const UPDATED = "9 October 2026"

const link = policyLink

export default function PrivacyPage() {
  return (
    <PolicyPage title="Privacy" updated={UPDATED}>
      <Section title="When you order" wide>
        <p>
          You give us your name, email, phone number and delivery address. We use them to run your order: to email
          you the payment details, match your transfer, confirm the order on WhatsApp, and deliver it. Once it has
          been delivered we email you to ask for a review, and once more two days later if you haven&rsquo;t written
          one. Those are the only emails we send.
        </p>
        <p>
          Orders are stored on Supabase, our database provider. Our emails are sent through Brevo, our email provider,
          and a copy of each new order&rsquo;s details goes to the shop&rsquo;s owners by email. Whoever delivers your
          order gets your name, phone number and address.
        </p>
        <p>
          You don&rsquo;t pay on this site. Transfers happen in your own bank, JazzCash or Easypaisa app.
        </p>
      </Section>

      <Section title="Your cart">
        <p>Your cart stays in your own browser until you place an order.</p>
      </Section>

      <Section title="Reviews">
        <p>
          If you write a review, the name and words you submit appear on the site once we publish it, along with any
          photos or video you attach. Your email and order number are used only to check that you bought the build.
        </p>
      </Section>

      <Section title="Meta (Facebook and Instagram) ads" wide>
        <p>
          We use the Meta Pixel to measure our ads. It sets cookies on brikc.it and tells Meta which pages and builds
          you look at, what you add to your cart, and when you check out or place an order, with prices.
        </p>
        <p>
          When we confirm payment for an order &mdash; including one placed with us on WhatsApp or Instagram &mdash; we
          send Meta the order&rsquo;s value and items, with your email, phone number, name, city, province, postcode
          and country, scrambled (hashed) before they leave us. For an order placed on this site we also send your IP
          address, your browser and those cookie IDs, so Meta can connect the sale to the ad that led to it; an order
          placed with us on WhatsApp or Instagram has none of those to send. That lets Meta tell whether our ads reach
          people who buy.
        </p>
        <p>
          Meta&rsquo;s use of this is governed by{" "}
          <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noreferrer" className={link}>
            Meta&rsquo;s Privacy Policy
          </a>
          .
        </p>
      </Section>

      <Section title="Your choices">
        <p>
          You can block these cookies in your browser&rsquo;s settings or with a tracker blocker. On Facebook or
          Instagram, <strong className="text-[var(--foreground)]">Accounts Center → Your information and permissions →
          Your activity off Meta technologies</strong> lets you disconnect activity like this from your account.
        </p>
      </Section>

      <Section title="Questions">
        <p>
          To ask what we hold about you, or to have it corrected or deleted, email{" "}
          <a href="mailto:orders@brikc.it" className={link}>
            orders@brikc.it
          </a>
          .
        </p>
      </Section>
    </PolicyPage>
  )
}
