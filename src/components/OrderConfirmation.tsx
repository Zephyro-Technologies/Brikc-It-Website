"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, Copy, MessageCircle } from "lucide-react"
import { money } from "../lib/money"
import type { PaymentDetails } from "../data"
import { CONFIRMATION_KEY, paymentAccounts, receiptLink, type PlacedOrder } from "../lib/checkout"

function Copyable({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard blocked — the value is on screen to be typed out anyway.
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold tracking-widest text-[var(--muted)] uppercase">{label}</p>
        {/* Wrapped, never truncated. These are the numbers somebody has to type
          into their banking app, and the note above says the value is on screen
          to be read when the clipboard is blocked — truncate made that untrue.
          A 24-character IBAN was cut by 30px at 320px. */}
        <p className="mt-0.5 text-sm font-medium break-all">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label}`}
        className={`mat-btn flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
          copied
            ? "bg-emerald-100 text-emerald-700"
            : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"
        }`}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  )
}

function Account({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-1)]">
      <p className="font-display border-b border-[var(--border)] px-4 py-3" style={{ fontWeight: 700 }}>
        {title}
      </p>
      <div className="divide-y divide-[var(--border)]">
        {rows.map(([label, value]) => (
          <Copyable key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  )
}

export default function OrderConfirmation({ payment }: { payment: PaymentDetails }) {
  const [order, setOrder] = useState<PlacedOrder | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CONFIRMATION_KEY)
      if (raw) setOrder(JSON.parse(raw) as PlacedOrder)
    } catch {
      // Nothing stored, or unreadable. Handled by the empty state below.
    }
    setReady(true)
  }, [])

  if (!ready) return <div className="min-h-[60vh]" />

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-28 pb-24 text-center md:pt-36">
        <h1 className="font-display text-3xl tracking-tight" style={{ fontWeight: 800 }}>
          Nothing to show here
        </h1>
        <p className="mt-4 text-[var(--muted)]">
          This page shows the payment details for an order you&rsquo;ve just placed. If you closed
          the tab before paying, message us and we&rsquo;ll send them again.
        </p>
        <Link
          href="/shop"
          className="mat-btn mt-8 inline-block rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-2)] hover:brightness-105"
        >
          Back to the shop
        </Link>
      </div>
    )
  }

  const { whatsapp } = payment
  const firstName = order.name.trim().split(/\s+/)[0]

  return (
    <div className="mx-auto max-w-2xl px-5 pt-28 pb-24 md:pt-36">
      <h1 className="font-display text-4xl tracking-tight md:text-5xl" style={{ fontWeight: 800 }}>
        Thanks{firstName ? `, ${firstName}` : ""} — one step left.
      </h1>

      <div className="mt-8 grid gap-px overflow-hidden rounded-3xl bg-[var(--border)] shadow-[var(--shadow-1)] sm:grid-cols-2">
        <div className="bg-white px-5 py-4">
          <p className="text-[10px] font-semibold tracking-widest text-[var(--muted)] uppercase">Your reference</p>
          <p className="font-display mt-1 text-2xl" style={{ fontWeight: 800 }}>
            {order.number}
          </p>
        </div>
        <div className="bg-white px-5 py-4">
          <p className="text-[10px] font-semibold tracking-widest text-[var(--muted)] uppercase">
            Amount to transfer
          </p>
          <p className="font-display mt-1 text-2xl" style={{ fontWeight: 800 }}>
            {money(order.total)}
          </p>
          {(order.discount ?? 0) > 0 && (
            <p className="mt-1 text-xs font-medium text-[var(--primary)]">
              {order.coupon} took off {money(order.discount ?? 0)}
            </p>
          )}
          {order.shipping > 0 && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              Includes {money(order.shipping)} for {order.deliveryLabel.toLowerCase()}
            </p>
          )}
        </div>
      </div>

      <p className="mt-6 leading-relaxed text-[var(--muted)]">
        Nothing has been charged. Transfer <strong className="text-[var(--foreground)]">{money(order.total)}</strong>{" "}
        to any one of the accounts below, then send us the receipt on WhatsApp with your reference{" "}
        <strong className="text-[var(--foreground)]">{order.number}</strong>. We confirm the order as soon as the
        transfer shows up, and that&rsquo;s when the build starts.
      </p>

      <div className="mt-8 space-y-4">
        {paymentAccounts(payment).map((a, i) => (
          <Account key={i} title={a.title} rows={a.rows} />
        ))}
      </div>

      {/* canCheckout() needs a WhatsApp number to open the checkout, but only
        when the page loads — clear it while somebody is mid-checkout and this
        would link to a wa.me page with nobody on it. The email has the same guard. */}
      {whatsapp && (
        <>
          <a
            href={receiptLink(whatsapp, order)}
            target="_blank"
            rel="noreferrer"
            className="mat-btn font-display mt-8 flex w-full items-center justify-center gap-2.5 rounded-full bg-[var(--primary)] py-4 text-lg text-white shadow-[var(--shadow-2)] hover:brightness-105"
            style={{ fontWeight: 700 }}
          >
            <MessageCircle className="h-5 w-5" />
            Send the receipt on WhatsApp
          </a>
          <p className="mt-3 text-center text-xs text-[var(--muted)]">
            Opens WhatsApp with your order number already written out. Attach the screenshot and send.
          </p>
        </>
      )}

      <div className="mt-12 rounded-3xl bg-white p-5 shadow-[var(--shadow-1)]">
        <p className="mb-3 text-[11px] font-semibold tracking-widest text-[var(--muted)] uppercase">
          What happens next
        </p>
        <ol className="space-y-2 text-sm text-[var(--muted)]">
          <li>1. You transfer the amount and send us the receipt.</li>
          <li>2. We check it against the order and confirm on WhatsApp.</li>
          <li>
            3. Your build starts.{" "}
            {order.shipping > 0
              ? "We arrange a time with you and bring it round in person."
              : "We send tracking once it ships."}
          </li>
        </ol>
      </div>

      <p className="mt-8 text-center text-sm text-[var(--muted)]">
        Keep this reference: <strong className="text-[var(--foreground)]">{order.number}</strong>
      </p>
    </div>
  )
}
