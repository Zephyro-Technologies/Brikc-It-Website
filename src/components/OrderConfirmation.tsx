"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, Copy, MessageCircle } from "lucide-react"
import { money } from "../cart"
import type { PaymentDetails } from "../data"
import { CONFIRMATION_KEY, receiptLink, type PlacedOrder } from "../lib/checkout"

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
        <p className="ff-mono text-[10px] tracking-widest text-zinc-500 uppercase">{label}</p>
        <p className="ff-mono mt-0.5 truncate text-sm text-zinc-100">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label}`}
        className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:text-white"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  )
}

function Account({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#101012]">
      <p className="ff-display border-b border-white/10 px-4 py-3 font-bold">{title}</p>
      <div className="divide-y divide-white/10">
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
        <h1 className="ff-display text-3xl font-extrabold tracking-tight">Nothing to show here</h1>
        <p className="mt-4 text-zinc-400">
          This page shows the payment details for an order you&rsquo;ve just placed. If you closed
          the tab before paying, message us and we&rsquo;ll send them again.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-block rounded-full border border-white/20 px-6 py-3 ff-display font-semibold hover:bg-white/5"
        >
          Back to the shop
        </Link>
      </div>
    )
  }

  const { bank, jazzcash, easypaisa, whatsapp } = payment
  const firstName = order.name.trim().split(/\s+/)[0]

  return (
    <div className="mx-auto max-w-2xl px-5 pt-28 pb-24 md:pt-36">
      <p className="ff-mono text-[11px] tracking-widest text-[#ff6b4a] uppercase">Order placed</p>
      <h1 className="ff-display mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
        Thanks{firstName ? `, ${firstName}` : ""} — one step left.
      </h1>

      <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2">
        <div className="bg-[#101012] px-5 py-4">
          <p className="ff-mono text-[10px] tracking-widest text-zinc-500 uppercase">Your reference</p>
          <p className="ff-display mt-1 text-2xl font-extrabold">{order.number}</p>
        </div>
        <div className="bg-[#101012] px-5 py-4">
          <p className="ff-mono text-[10px] tracking-widest text-zinc-500 uppercase">Amount to transfer</p>
          <p className="ff-display mt-1 text-2xl font-extrabold">{money(order.total)}</p>
        </div>
      </div>

      <p className="mt-6 leading-relaxed text-zinc-400">
        Nothing has been charged. Transfer <strong className="text-zinc-200">{money(order.total)}</strong>{" "}
        to any one of the accounts below, then send us the receipt on WhatsApp with your reference{" "}
        <strong className="text-zinc-200">{order.number}</strong>. We confirm the order as soon as the
        transfer shows up, and that&rsquo;s when the build starts.
      </p>

      <div className="mt-8 space-y-4">
        {bank.title && (bank.number || bank.iban) && (
          <Account
            title={bank.name || "Bank transfer"}
            rows={[
              ["Account title", bank.title],
              ...(bank.number ? ([["Account number", bank.number]] as [string, string][]) : []),
              ...(bank.iban ? ([["IBAN", bank.iban]] as [string, string][]) : []),
            ]}
          />
        )}
        {jazzcash.number && (
          <Account
            title="JazzCash"
            rows={[
              ["Account title", jazzcash.title],
              ["Number", jazzcash.number],
            ]}
          />
        )}
        {easypaisa.number && (
          <Account
            title="Easypaisa"
            rows={[
              ["Account title", easypaisa.title],
              ["Number", easypaisa.number],
            ]}
          />
        )}
      </div>

      <a
        href={receiptLink(whatsapp, order)}
        target="_blank"
        rel="noreferrer"
        className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-full bg-[#e63329] py-4 ff-display text-lg font-bold text-white transition-transform hover:scale-[1.02] led-glow-soft"
      >
        <MessageCircle className="h-5 w-5" />
        Send the receipt on WhatsApp
      </a>
      <p className="mt-3 text-center text-xs text-zinc-600">
        Opens WhatsApp with your order number already written out. Attach the screenshot and send.
      </p>

      <div className="mt-12 rounded-xl border border-white/10 bg-[#101012] p-5">
        <p className="ff-mono mb-3 text-[11px] tracking-widest text-zinc-500 uppercase">What happens next</p>
        <ol className="space-y-2 text-sm text-zinc-400">
          <li>1. You transfer the amount and send us the receipt.</li>
          <li>2. We check it against the order and confirm on WhatsApp.</li>
          <li>3. Your build starts, and we send tracking once it ships.</li>
        </ol>
      </div>

      <p className="mt-8 text-center text-sm text-zinc-500">
        Keep this reference:{" "}
        <strong className="ff-mono text-zinc-300">{order.number}</strong>
      </p>
    </div>
  )
}
