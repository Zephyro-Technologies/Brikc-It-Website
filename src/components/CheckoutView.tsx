"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, Loader2, ShoppingBag } from "lucide-react"
import { useCart, money } from "../cart"
import { FORMAT_LABELS, cityQualifies, type DeliveryOption, type Product, type ShippingMethod } from "../data"
import { CONFIRMATION_KEY } from "../lib/checkout"

const FIELD =
  "w-full rounded-md border border-white/15 bg-[#101012] px-3 py-2.5 text-zinc-100 outline-none " +
  "placeholder:text-zinc-600 focus:border-[#e63329] disabled:opacity-50"

function Field({
  label,
  id,
  value,
  onChange,
  hint,
  ...rest
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  hint?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "id">) {
  return (
    <div>
      <label htmlFor={id} className="ff-mono mb-1.5 block text-[11px] tracking-widest text-zinc-500 uppercase">
        {label}
      </label>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className={FIELD} {...rest} />
      {hint && <p className="mt-1 text-xs text-zinc-600">{hint}</p>}
    </div>
  )
}

export default function CheckoutView({
  products,
  ordersOpen,
  instagram,
  delivery,
}: {
  products: Product[]
  /** False when no payment details are set — see canCheckout(). */
  ordersOpen: boolean
  instagram: string
  delivery: DeliveryOption[]
}) {
  const router = useRouter()
  const { lines, clear } = useCart()

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    province: "",
    postcode: "",
  })
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const [method, setMethod] = useState<ShippingMethod>("standard")

  /**
   * Hand delivery only reaches certain towns, so the choice depends on the
   * address as it is being typed. If a shopper picks it and then changes city,
   * the selection has to fall back rather than quietly overcharging them for a
   * delivery that can't happen — the database would reject it anyway.
   */
  const eligible = useMemo(
    () => delivery.filter((o) => cityQualifies(o, form.city)),
    [delivery, form.city],
  )
  const chosen = eligible.find((o) => o.id === method) ?? eligible[0] ?? delivery[0]
  const shipping = chosen?.fee ?? 0

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * The cart survives in localStorage, so a line saved last week can be
   * carrying last week's price. Everything shown here is recomputed from the
   * catalogue as it is right now — which is also what the database will charge,
   * so the total on screen and the total on the order agree.
   */
  const priced = useMemo(() => {
    const bySlug = new Map(products.map((p) => [p.slug, p]))
    return lines.map((l) => {
      const product = bySlug.get(l.slug)
      const unavailable = !product
        ? "no longer in the catalogue"
        : !product.inStock
          ? "sold out"
          : !product.formats[l.format]
            ? `no longer sold ${FORMAT_LABELS[l.format].toLowerCase()}`
            : null
      const unitPrice = product ? product.prices[l.format] : l.unitPrice
      return { ...l, unitPrice, unavailable, changed: !unavailable && unitPrice !== l.unitPrice }
    })
  }, [lines, products])

  const blocked = priced.filter((l) => l.unavailable)
  const repriced = priced.filter((l) => l.changed)
  const subtotal = priced.reduce((n, l) => (l.unavailable ? n : n + l.unitPrice * l.qty), 0)
  const total = subtotal + shipping

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy || blocked.length > 0) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer: { name: form.name, email: form.email, phone: form.phone },
          address: {
            line1: form.line1,
            line2: form.line2,
            city: form.city,
            province: form.province,
            postcode: form.postcode,
          },
          lines: priced.map((l) => ({ slug: l.slug, format: l.format, qty: l.qty })),
          shippingMethod: chosen?.id ?? "standard",
        }),
      })
      const body = (await res.json()) as {
        number?: string
        total?: number
        shipping?: number
        error?: string
      }
      if (!res.ok || !body.number) {
        setError(body.error ?? "We couldn't place that order.")
        return
      }

      // Handed to the confirmation page this way rather than in the URL: an
      // order reference in a shareable link is an invitation to go looking at
      // other people's.
      sessionStorage.setItem(
        CONFIRMATION_KEY,
        JSON.stringify({
          number: body.number,
          total: body.total ?? total,
          name: form.name,
          shipping: body.shipping ?? shipping,
          deliveryLabel: chosen?.label ?? "Standard delivery",
        }),
      )
      clear()
      router.push("/checkout/confirmation")
    } catch {
      setError("Couldn't reach us just then. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  if (lines.length === 0) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-white/10 bg-[#101012] px-6 py-20 text-center">
          <ShoppingBag className="h-10 w-10 text-zinc-600" />
          <p className="text-zinc-400">There&rsquo;s nothing in your cart yet.</p>
          <Link
            href="/shop"
            className="rounded-full bg-[#e63329] px-6 py-3 ff-display font-bold text-white led-glow-soft"
          >
            Browse builds
          </Link>
        </div>
      </Shell>
    )
  }

  if (!ordersOpen) {
    return (
      <Shell>
        <div className="rounded-2xl border border-white/10 bg-[#101012] p-8">
          <h2 className="ff-display text-xl font-extrabold">Ordering online is off right now</h2>
          <p className="mt-3 leading-relaxed text-zinc-400">
            We take orders by hand at the moment. Message us on Instagram at{" "}
            <a
              href={`https://instagram.com/${instagram.replace(/^@/, "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-[#ff6b4a] underline-offset-4 hover:underline"
            >
              @{instagram.replace(/^@/, "")}
            </a>{" "}
            with what you&rsquo;re after and we&rsquo;ll get it sorted.
          </p>
          <p className="ff-mono mt-6 text-[11px] tracking-widest text-zinc-600 uppercase">
            Your cart is saved — it&rsquo;ll still be here.
          </p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="space-y-8">
          <section>
            <h2 className="ff-display text-lg font-extrabold">Where it&rsquo;s going</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" id="name" value={form.name} onChange={set("name")} required autoComplete="name" maxLength={120} />
              <Field label="Phone" id="phone" value={form.phone} onChange={set("phone")} required autoComplete="tel" placeholder="03001234567" maxLength={40} />
              <div className="sm:col-span-2">
                <Field label="Email" id="email" type="email" value={form.email} onChange={set("email")} required autoComplete="email" maxLength={200} hint="So we have your order on record and can reach you about it." />
              </div>
              <div className="sm:col-span-2">
                <Field label="Address" id="line1" value={form.line1} onChange={set("line1")} required autoComplete="address-line1" maxLength={200} />
              </div>
              <div className="sm:col-span-2">
                <Field label="Apartment, suite, landmark" id="line2" value={form.line2} onChange={set("line2")} autoComplete="address-line2" maxLength={200} hint="Optional." />
              </div>
              <Field label="City" id="city" value={form.city} onChange={set("city")} required autoComplete="address-level2" maxLength={80} />
              <Field label="Province" id="province" value={form.province} onChange={set("province")} autoComplete="address-level1" maxLength={80} />
              <Field label="Postcode" id="postcode" value={form.postcode} onChange={set("postcode")} autoComplete="postal-code" maxLength={20} />
            </div>
          </section>

          <section>
            <h2 className="ff-display text-lg font-extrabold">How it gets to you</h2>
            <div className="mt-4 space-y-3">
              {delivery.map((o) => {
                const ok = cityQualifies(o, form.city)
                const on = chosen?.id === o.id
                return (
                  <label
                    key={o.id}
                    className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                      on ? "border-[#e63329] bg-[#140b0a]" : "border-white/10"
                    } ${ok ? "cursor-pointer hover:border-white/30" : "cursor-not-allowed opacity-45"}`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value={o.id}
                      checked={on}
                      disabled={!ok}
                      onChange={() => setMethod(o.id)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[#e63329]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="ff-display font-bold">{o.label}</span>
                        <span className="ff-display font-bold">
                          {o.fee > 0 ? money(o.fee) : "Free"}
                        </span>
                      </span>
                      <span className="mt-1 block text-sm text-zinc-400">{o.detail}</span>
                      {!ok && (
                        <span className="ff-mono mt-1.5 block text-[11px] tracking-wider text-amber-400/80 uppercase">
                          {form.city.trim()
                            ? `Not available in ${form.city.trim()}`
                            : "Enter your city to see if this is available"}
                        </span>
                      )}
                      {ok && o.link && (
                        <a
                          href={o.link}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1.5 inline-block text-xs text-[#ff6b4a] underline-offset-4 hover:underline"
                        >
                          Who&rsquo;s delivering &rarr;
                        </a>
                      )}
                    </span>
                  </label>
                )
              })}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#101012] p-5">
            <h2 className="ff-display text-lg font-extrabold">How you&rsquo;ll pay</h2>
            <p className="mt-2 leading-relaxed text-zinc-400">
              Bank transfer or mobile wallet. Place the order first — the next page gives you the
              account details and your order number, and you send the receipt to us on WhatsApp.
              Nothing is charged automatically and we start the build once the transfer lands.
            </p>
          </section>
        </div>

        <aside className="space-y-4 rounded-2xl border border-white/10 bg-[#101012] p-5 lg:sticky lg:top-28">
          <h2 className="ff-display text-lg font-extrabold">Your order</h2>

          <ul className="space-y-3">
            {priced.map((l) => (
              <li key={l.key} className="flex gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.image} alt={l.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="ff-display truncate text-sm font-bold">{l.name}</p>
                  <p className="ff-mono text-[10px] tracking-widest text-[#ff6b4a] uppercase">
                    {FORMAT_LABELS[l.format]} × {l.qty}
                  </p>
                  {l.unavailable && (
                    <p className="mt-1 text-xs text-amber-400">This one is {l.unavailable}.</p>
                  )}
                </div>
                <span className={`ff-display text-sm font-bold ${l.unavailable ? "text-zinc-600 line-through" : ""}`}>
                  {money(l.unitPrice * l.qty)}
                </span>
              </li>
            ))}
          </ul>

          {repriced.length > 0 && (
            <p className="rounded-md border border-white/10 bg-[#09090a] p-3 text-xs text-zinc-400">
              Prices have changed since you added {repriced.length === 1 ? "that build" : "those builds"}
              . The figures above are current.
            </p>
          )}

          <div className="space-y-2 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between gap-3 text-sm text-zinc-400">
              <span className="min-w-0 truncate">{chosen?.label ?? "Delivery"}</span>
              <span className="shrink-0 text-zinc-300">{shipping > 0 ? money(shipping) : "Free"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="ff-display font-bold">Total</span>
              <span className="ff-display text-xl font-extrabold">{money(total)}</span>
            </div>
          </div>

          {blocked.length > 0 && (
            <p className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Remove the unavailable {blocked.length === 1 ? "item" : "items"} from your cart to carry on.</span>
            </p>
          )}

          {error && (
            <p className="rounded-md border border-[#e63329]/50 bg-[#e63329]/10 p-3 text-sm text-red-200">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy || blocked.length > 0}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#e63329] py-3.5 ff-display font-bold text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 led-glow-soft"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Placing your order…" : "Place order"}
          </button>
          <p className="text-center text-xs text-zinc-600">
            You&rsquo;ll get the payment details on the next page.
          </p>
        </aside>
      </form>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-28 pb-24 md:pt-36">
      <Link
        href="/shop"
        className="ff-mono inline-flex items-center gap-2 text-[11px] tracking-widest text-zinc-500 uppercase hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Keep shopping
      </Link>
      <h1 className="ff-display mt-4 mb-10 text-4xl font-extrabold tracking-tight md:text-5xl">Checkout</h1>
      {children}
    </div>
  )
}
