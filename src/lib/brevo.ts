/**
 * One email out through Brevo's transactional API.
 *
 * `BREVO_API_KEY` is a Worker secret and optional: unset, nothing is sent and
 * the outcome says why. That is what local development wants — a test order
 * never emails a real address.
 */

/**
 * The address authenticated with Brevo as brikc.it's sending domain; Brevo
 * refuses a sender on a domain it hasn't verified. Replies land here too, and
 * Cloudflare Email Routing forwards them to an owner's inbox.
 */
const SENDER = { name: "brikc.it", email: "orders@brikc.it" }

/** Well inside the 30 seconds the database gives /api/emails to answer. */
const TIMEOUT_MS = 10_000

export type Outcome = { ok: true } | { ok: false; reason: string }

export const describe = (err: unknown) => (err instanceof Error ? err.message : String(err))

export async function sendEmail(email: {
  to: { email: string; name?: string }[]
  subject: string
  html: string
  text: string
  /** What Brevo's logs file it under. */
  tag: string
  /** Where a reply goes. The shop's own address unless the email says otherwise. */
  replyTo?: { email: string; name?: string }
}): Promise<Outcome> {
  const key = process.env.BREVO_API_KEY
  if (!key) return { ok: false, reason: "BREVO_API_KEY is not set" }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: SENDER,
        replyTo: email.replyTo ?? SENDER,
        // Brevo refuses a display name over 70 characters, and checkout allows
        // 120. The name is cosmetic — the greeting is in the body — so a long
        // one is left off rather than cut mid-word.
        to: email.to.map(({ email, name }) => ({ email, ...(name && name.length <= 70 && { name }) })),
        subject: email.subject,
        htmlContent: email.html,
        textContent: email.text,
        tags: [email.tag],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (res.ok) return { ok: true }

    const body = (await res.json().catch(() => null)) as { message?: string } | null
    return { ok: false, reason: `Brevo ${res.status}${body?.message ? `: ${body.message}` : ""}` }
  } catch (err) {
    return { ok: false, reason: `Brevo unreachable (${describe(err)})` }
  }
}
