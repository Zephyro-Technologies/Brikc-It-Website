"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Check, Clock, RefreshCw } from "lucide-react"
import { money } from "../lib/money"
import type { PaymentSession } from "../lib/checkout"

/**
 * Rapid Gateway's embedded payment form, and what the page says around it.
 *
 * The form is their iframe (rapidpay.js), so the bank or wallet details never
 * touch this page. What it reports back — success, pending, error — is a
 * message from another window, which anything on the page could fake, so
 * "success" only means "go and ask": the server checks the session with Rapid
 * Gateway (/api/pay/status) before this says the order is paid. The order is
 * marked paid by their signed webhook, not by anything here.
 *
 * Pending is a wallet payment waiting for the shopper to approve it on their
 * phone; the page keeps asking until it settles or a few minutes pass.
 */

const SDK = "https://secure.rapid-gateway.com/sdk/v1/rapidpay.js"
const POLL_MS = 3_000
/** How long a payment waiting on wallet approval is watched before the page stops asking. */
const PENDING_FOR_MS = 5 * 60_000

type RapidPay = (key: string) => {
  mountCheckout: (
    el: HTMLElement,
    opts: {
      clientSecret: string
      amount: number
      currency: string
      merchantName: string
      currencyLabel: string
      showSuccessScreen: boolean
      onSuccess: () => void
      onPending: () => void
      onError: (e: Error) => void
    },
  ) => { destroy: () => void }
}

declare global {
  interface Window {
    RapidPay?: RapidPay
  }
}

let sdk: Promise<RapidPay> | null = null

function loadSdk(): Promise<RapidPay> {
  if (window.RapidPay) return Promise.resolve(window.RapidPay)
  sdk ??= new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = SDK
    script.async = true
    script.onload = () => (window.RapidPay ? resolve(window.RapidPay) : reject(new Error("RapidPay missing")))
    script.onerror = () => {
      sdk = null
      reject(new Error("Couldn't load the payment form"))
    }
    document.head.appendChild(script)
  })
  return sdk
}

type Stage = "form" | "checking" | "pending" | "paid" | "failed"

export default function PayOnline({
  session: first,
  number,
  email,
  total,
  startError,
  paid = false,
  onPaid,
  onTransfer,
}: {
  session?: PaymentSession
  number: string
  email: string
  total: number
  /** Why the form couldn't be opened at checkout, if it couldn't. */
  startError?: string
  /** Already paid — remembered from earlier in this visit. */
  paid?: boolean
  onPaid: () => void
  /** "Pay by bank transfer instead" — the page shows the transfer details. */
  onTransfer: () => void
}) {
  const [session, setSession] = useState<PaymentSession | undefined>(first)
  const [stage, setStage] = useState<Stage>(paid ? "paid" : first ? "form" : "failed")
  const [message, setMessage] = useState(startError ?? (first ? "" : "Online payment couldn't be started."))
  const [busy, setBusy] = useState(false)
  const mount = useRef<HTMLDivElement>(null)
  const polling = useRef(false)

  /** Asks the server until the payment is settled one way or the other. */
  const watch = useCallback(
    async (sessionId: string, waiting: boolean) => {
      if (polling.current) return
      polling.current = true
      setStage(waiting ? "pending" : "checking")
      const until = Date.now() + (waiting ? PENDING_FOR_MS : 60_000)
      try {
        while (Date.now() < until) {
          const res = await fetch(`/api/pay/status?session=${encodeURIComponent(sessionId)}`, { cache: "no-store" })
          const body = (await res.json().catch(() => ({}))) as { status?: string }
          if (body.status === "SUCCEEDED") {
            setStage("paid")
            onPaid()
            return
          }
          if (body.status === "FAILED" || body.status === "EXPIRED") {
            setStage("failed")
            setMessage(body.status === "EXPIRED" ? "That payment timed out." : "That payment didn't go through.")
            return
          }
          await new Promise((r) => setTimeout(r, POLL_MS))
        }
        // Still not settled. Not a failure — a wallet approval can take a while,
        // and the webhook will mark the order paid whenever it lands.
        setStage("pending")
        setMessage("Still waiting for your payment to be approved.")
      } catch {
        setStage("pending")
        setMessage("Couldn't check the payment just now.")
      } finally {
        polling.current = false
      }
    },
    [onPaid],
  )

  // Mount the form whenever there is a fresh session to show.
  useEffect(() => {
    if (!session || stage !== "form" || !mount.current) return
    let checkout: { destroy: () => void } | null = null
    let gone = false
    loadSdk()
      .then((RapidPay) => {
        if (gone || !mount.current) return
        checkout = RapidPay(session.publishableKey).mountCheckout(mount.current, {
          clientSecret: session.clientSecret,
          amount: session.amount,
          currency: "PKR",
          merchantName: "brikc.it",
          currencyLabel: "Rs",
          // Our own "payment received" below is the only one they should see.
          showSuccessScreen: false,
          onSuccess: () => void watch(session.sessionId, false),
          onPending: () => void watch(session.sessionId, true),
          onError: (e) => setMessage(e.message || "That payment didn't go through."),
        })
      })
      .catch(() => {
        setStage("failed")
        setMessage("The payment form couldn't be loaded.")
      })
    return () => {
      gone = true
      checkout?.destroy()
    }
  }, [session, stage, watch])

  async function again() {
    setBusy(true)
    setMessage("")
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ number, email }),
      })
      const body = (await res.json().catch(() => ({}))) as PaymentSession & { error?: string }
      if (!res.ok || !body.clientSecret) {
        setMessage(body.error ?? "Online payment couldn't be started.")
        return
      }
      setSession(body)
      setStage("form")
    } catch {
      setMessage("Couldn't reach us just then.")
    } finally {
      setBusy(false)
    }
  }

  if (stage === "paid") {
    return (
      <div className="mt-8 rounded-3xl bg-white p-6 text-center shadow-[var(--shadow-1)]">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--primary)] text-white">
          <Check className="h-7 w-7" />
        </span>
        <p className="font-display mt-4 text-2xl" style={{ fontWeight: 800 }}>
          Payment received
        </p>
        <p className="mt-2 text-[var(--muted)]">
          {money(total)} paid for order <strong className="text-[var(--foreground)]">{number}</strong>. Your
          build is confirmed, and a receipt is on its way to {email}.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8">
      {session?.env === "TEST" && (
        <p className="mb-3 rounded-2xl bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold text-[var(--muted)]">
          Test mode — Rapid Gateway&rsquo;s sandbox. No real money moves.
        </p>
      )}

      {stage === "form" && (
        <div className="overflow-hidden rounded-3xl bg-white p-2 shadow-[var(--shadow-1)]">
          <div ref={mount} className="min-h-[420px]" />
        </div>
      )}

      {(stage === "checking" || stage === "pending") && (
        <div className="rounded-3xl bg-white p-6 text-center shadow-[var(--shadow-1)]" aria-live="polite">
          <Clock className="mx-auto h-8 w-8 text-[var(--primary)]" />
          <p className="font-display mt-3 text-xl" style={{ fontWeight: 700 }}>
            {stage === "checking" ? "Confirming your payment…" : "Waiting for approval"}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {message ||
              (stage === "checking"
                ? "This takes a few seconds."
                : "Approve the payment in your banking or wallet app. This page updates when it goes through.")}
          </p>
          {stage === "pending" && session && (
            <button
              type="button"
              onClick={() => void watch(session.sessionId, true)}
              className="mat-btn mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-semibold"
            >
              <RefreshCw className="h-4 w-4" />
              Check again
            </button>
          )}
        </div>
      )}

      {stage === "failed" && (
        <div className="rounded-3xl bg-white p-6 text-center shadow-[var(--shadow-1)]" aria-live="polite">
          <p className="font-display text-xl" style={{ fontWeight: 700 }}>
            {message || "That payment didn't go through."}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Your order {number} is saved. Try again, or pay by bank transfer instead.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={again}
              disabled={busy}
              className="mat-btn rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-1)] disabled:opacity-60"
            >
              {busy ? "Opening…" : "Try paying online again"}
            </button>
            <button
              type="button"
              onClick={onTransfer}
              className="mat-btn rounded-full border border-[var(--border)] bg-white px-6 py-3 text-sm font-semibold"
            >
              Pay by bank transfer
            </button>
          </div>
        </div>
      )}

      {stage === "form" && (
        <p className="mt-3 text-center text-xs text-[var(--muted)]">
          {message && <span className="mb-1 block font-semibold text-[var(--primary)]">{message}</span>}
          Secured by Rapid Gateway. Your bank and wallet details go to them, never to us.{" "}
          <button type="button" onClick={onTransfer} className="font-semibold text-[var(--foreground)] underline">
            Pay by bank transfer instead
          </button>
        </p>
      )}
    </div>
  )
}
