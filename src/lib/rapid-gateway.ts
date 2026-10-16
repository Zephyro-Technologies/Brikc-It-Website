import "server-only"

/**
 * Rapid Gateway, from this app's side: an access token, an embedded checkout
 * session, its status, and the signature on a webhook. Their documentation is
 * in the merchant portal (rapidgateway.pk → Documentation), and every shape
 * below was checked against their sandbox.
 *
 * Configured by three settings, none of them in this public repository:
 *
 *   RAPID_ENV            "live", "test" or unset. Unset is off: checkout offers
 *                        no online payment and nothing here is called.
 *   RAPID_MERCHANT_ID    1311 for brikc.it. Not secret — it is in the public key.
 *   RAPID_CLIENT_SECRET  the live Secret Key from the portal's Credentials page.
 *                        The sandbox uses Rapid Gateway's shared test login
 *                        instead, the same for every merchant.
 *   RAPID_WEBHOOK_SECRET the signing secret saved beside the webhook URL under
 *                        Settings → Webhooks — one per environment, so the TEST
 *                        one while RAPID_ENV is "test".
 *   RAPID_TEST_EMAILS    while RAPID_ENV is "test", the only customer emails
 *                        that can pay online — comma-separated. See below.
 */

const BASE = "https://secure.rapid-gateway.com"

/** The sandbox's shared client, published in their docs: "Not your live keys." */
const TEST_CLIENT = { id: "client", secret: "secret" }

const TIMEOUT_MS = 10_000

export type GatewayEnv = "LIVE" | "TEST"

/** Which environment payments go to, or null when online payment is off. */
export function gatewayEnv(): GatewayEnv | null {
  const env = (process.env.RAPID_ENV ?? "").trim().toLowerCase()
  if (env === "live") return "LIVE"
  if (env === "test") return "TEST"
  return null
}

/**
 * Whether this customer may pay online right now. Always, once live. On the
 * sandbox, only the testers listed in RAPID_TEST_EMAILS — enforced here, on the
 * server, because the sandbox's login is published in Rapid Gateway's docs and
 * its payments are play money: anybody else allowed to pay that way would get
 * a real order marked paid for nothing. An empty list lets nobody through.
 */
export function mayPayOnline(email: string): boolean {
  const env = gatewayEnv()
  if (env === "LIVE") return true
  if (env !== "TEST") return false
  const testers = (process.env.RAPID_TEST_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return testers.includes(email.trim().toLowerCase())
}

function merchantId(): number {
  const id = Number(process.env.RAPID_MERCHANT_ID)
  if (!Number.isInteger(id) || id <= 0) throw new Error("RAPID_MERCHANT_ID is not set")
  return id
}

export class GatewayError extends Error {}

/**
 * Their tokens last five minutes. One is kept for as long as this Worker
 * isolate lives, and fetched again a little before it runs out.
 */
let cached: { env: GatewayEnv; token: string; until: number } | null = null

async function accessToken(env: GatewayEnv): Promise<string> {
  if (cached && cached.env === env && cached.until > Date.now()) return cached.token

  const client =
    env === "TEST"
      ? TEST_CLIENT
      : { id: String(merchantId()), secret: process.env.RAPID_CLIENT_SECRET ?? "" }
  if (!client.secret) throw new GatewayError("RAPID_CLIENT_SECRET is not set")

  const res = await fetch(`${BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      authorization: `Basic ${btoa(`${client.id}:${client.secret}`)}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  const body = (await res.json().catch(() => null)) as { access_token?: string; expires_in?: number } | null
  if (!res.ok || !body?.access_token) throw new GatewayError(`token request failed (${res.status})`)

  const life = (body.expires_in ?? 300) * 1000
  cached = { env, token: body.access_token, until: Date.now() + Math.max(life - 30_000, 30_000) }
  return body.access_token
}

/** Their responses wrap the useful part as { code, message, additionalData: { data } }. */
async function call<T>(env: GatewayEnv, path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken(env)
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      authorization: `Bearer ${token}`,
      "x-environment": env,
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  const body = (await res.json().catch(() => null)) as
    | { code?: string; message?: string; additionalData?: { data?: T } }
    | null
  const data = body?.additionalData?.data
  if (!res.ok || !data) {
    throw new GatewayError(`${path} failed (${res.status}${body?.message ? `: ${body.message}` : ""})`)
  }
  return data
}

export type CheckoutSession = {
  sessionId: string
  clientSecret: string
  publishableKey: string
  amount: number
  expiresAt: number
}

/**
 * A session for the embedded checkout. The amount is fixed here, on the
 * server, from the order the database priced — the shopper's browser only
 * ever sees the client secret, and cannot change what it pays.
 */
export async function createCheckoutSession(order: {
  basketId: string
  total: number
  email: string
  phone: string
}): Promise<CheckoutSession> {
  const env = gatewayEnv()
  if (!env) throw new GatewayError("online payment is off")
  return call<CheckoutSession>(env, "/v1/checkout-sessions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      merchantId: merchantId(),
      amount: Number(order.total.toFixed(2)),
      currency: "PKR",
      basketId: order.basketId,
      customerEmail: order.email,
      customerMobile: walletNumber(order.phone),
    }),
  })
}

export type SessionStatus = "CREATED" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "EXPIRED"

export async function checkoutSessionStatus(sessionId: string): Promise<{ status: SessionStatus; basketId: string }> {
  const env = gatewayEnv()
  if (!env) throw new GatewayError("online payment is off")
  return call<{ status: SessionStatus; basketId: string }>(env, `/v1/checkout-sessions/${encodeURIComponent(sessionId)}`)
}

/**
 * The mobile number the way their API insists on it: 03XXXXXXXXX. Checkout
 * takes whatever the shopper types — +92 300…, 0300-…, 92300… — and this
 * brings any Pakistani mobile back to that shape. Anything else is passed as
 * typed and Rapid Gateway says what it thinks of it.
 */
export function walletNumber(phone: string): string {
  let d = phone.replace(/\D/g, "")
  if (d.startsWith("0092")) d = d.slice(4)
  else if (d.startsWith("92")) d = d.slice(2)
  else if (d.startsWith("0")) d = d.slice(1)
  return d.length === 10 && d.startsWith("3") ? `0${d}` : phone.trim()
}

/**
 * Whether a webhook really came from Rapid Gateway: HMAC-SHA256 of
 * "timestamp.rawBody" with the signing secret, upper-case hex, and a timestamp
 * within five minutes. Over the raw bytes, never re-serialised JSON — their
 * guide calls that the first cause of signatures that never match.
 */
export async function verifyWebhook(rawBody: string, timestamp: string, signature: string): Promise<boolean> {
  const secret = process.env.RAPID_WEBHOOK_SECRET
  if (!secret || !timestamp || !signature) return false

  const sent = Number(timestamp)
  // Seconds or milliseconds — whichever it is, it has to be recent.
  const sentMs = sent > 1e12 ? sent : sent * 1000
  if (!Number.isFinite(sentMs) || Math.abs(Date.now() - sentMs) > 300_000) return false

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${rawBody}`))
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase()
  return constantTimeEqual(expected, signature.trim().toUpperCase())
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
