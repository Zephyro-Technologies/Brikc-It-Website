"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, ChevronDown, Loader2, ShoppingBag } from "lucide-react"
import { useCart } from "../cart"
import { money } from "../lib/money"
import {
  FORMAT_LABELS,
  cityQualifies,
  type DeliveryOption,
  type FormatKey,
  type Product,
  type ShippingMethod,
} from "../data"
import { CONFIRMATION_KEY } from "../lib/checkout"
import { OTHER_CITY, PROVINCES, citiesIn } from "../lib/pakistan"

const FIELD =
  "w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-2.5 text-[var(--foreground)] outline-none " +
  "placeholder:text-[var(--muted)] transition-shadow focus:border-[var(--primary)] focus:ring-4 " +
  "focus:ring-[var(--primary)]/15 disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:opacity-60"

const LABEL = "mb-1.5 block text-xs font-semibold tracking-wide text-[var(--muted)] uppercase"

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
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className={FIELD} {...rest} />
      {hint && <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>}
    </div>
  )
}

function SelectField({
  label,
  id,
  value,
  onChange,
  children,
  hint,
  disabled,
  required,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
  hint?: string
  disabled?: boolean
  required?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          // appearance-none drops the native arrow, so one is drawn below —
          // without it the control reads as a text box that won't accept typing.
          className={`${FIELD} appearance-none pr-10`}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
      </div>
      {hint && <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>}
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
    /** Only used when city is the "not listed" sentinel. */
    cityOther: "",
    province: "",
    postcode: "",
  })

  /** What actually gets sent and matched against delivery coverage. */
  const city = form.city === OTHER_CITY ? form.cityOther.trim() : form.city
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const [method, setMethod] = useState<ShippingMethod>("standard")

  /**
   * Hand delivery only reaches certain towns, so the choice depends on the
   * address as it is being typed. If a shopper picks it and then changes city,
   * the selection has to fall back rather than quietly overcharging them for a
   * delivery that can't happen — the database would reject it anyway.
   */
  const eligible = useMemo(
    () => delivery.filter((o) => cityQualifies(o, city)),
    [delivery, city],
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
      if (!product) {
        return { ...l, unitPrice: l.unitPrice, unavailable: "no longer in the catalogue", changed: false }
      }
      if (l.kind === "display") {
        const variant = product.variants.find((v) => v.id === l.variantId)
        const unavailable = !variant
          ? "that size is no longer available"
          : !variant.inStock
            ? "sold out"
            : null
        const unitPrice = variant ? variant.price : l.unitPrice
        return { ...l, unitPrice, unavailable, changed: !unavailable && unitPrice !== l.unitPrice }
      }
      const format = l.format as FormatKey
      const unavailable = !product.inStock
        ? "sold out"
        : !product.formats[format]
          ? `no longer sold ${FORMAT_LABELS[format].toLowerCase()}`
          : null
      const unitPrice = product.prices[format]
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
            city,
            province: form.province,
            postcode: form.postcode,
          },
          lines: priced.map((l) =>
            l.kind === "display"
              ? { slug: l.slug, variant: l.variantId, qty: l.qty }
              : { slug: l.slug, format: l.format, qty: l.qty },
          ),
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
        <div className="flex flex-col items-center gap-5 rounded-3xl bg-white px-6 py-20 text-center shadow-[var(--shadow-1)]">
          <ShoppingBag className="h-10 w-10 text-[var(--muted)]" />
          <p className="text-[var(--muted)]">There&rsquo;s nothing in your cart yet.</p>
          <Link
            href="/shop"
            className="mat-btn rounded-full bg-[var(--primary)] px-6 py-3 font-display text-white shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)]"
            style={{ fontWeight: 700 }}
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
        <div className="rounded-3xl bg-white p-8 shadow-[var(--shadow-1)]">
          <h2 className="font-display text-xl" style={{ fontWeight: 800 }}>
            Ordering online is off right now
          </h2>
          <p className="mt-3 leading-relaxed text-[var(--muted)]">
            We take orders by hand at the moment. Message us on Instagram at{" "}
            <a
              href={`https://instagram.com/${instagram.replace(/^@/, "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--primary)] underline-offset-4 hover:underline"
            >
              @{instagram.replace(/^@/, "")}
            </a>{" "}
            with what you&rsquo;re after and we&rsquo;ll get it sorted.
          </p>
          <p className="mt-6 text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
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
          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-1)] sm:p-8">
            <h2 className="font-display text-lg" style={{ fontWeight: 700 }}>
              Where it&rsquo;s going
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
              <SelectField
                label="Province"
                id="province"
                required
                value={form.province}
                onChange={(v) =>
                  // A city from the old province would be nonsense under the new one.
                  setForm((f) => ({ ...f, province: v, city: "", cityOther: "" }))
                }
              >
                <option value="">Choose a province…</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="City"
                id="city"
                required
                value={form.city}
                disabled={!form.province}
                onChange={set("city")}
                hint={form.province ? undefined : "Pick a province first."}
              >
                <option value="">{form.province ? "Choose a city…" : "—"}</option>
                {citiesIn(form.province).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                {form.province && <option value={OTHER_CITY}>My town isn&apos;t listed</option>}
              </SelectField>

              {form.city === OTHER_CITY && (
                <div className="sm:col-span-2">
                  <Field
                    label="Which town?"
                    id="cityOther"
                    value={form.cityOther}
                    onChange={set("cityOther")}
                    required
                    maxLength={80}
                    hint="We&rsquo;ll check the courier reaches it before dispatch."
                  />
                </div>
              )}

              <Field label="Postcode" id="postcode" value={form.postcode} onChange={set("postcode")} autoComplete="postal-code" maxLength={20} />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-1)] sm:p-8">
            <h2 className="font-display text-lg" style={{ fontWeight: 700 }}>
              How it gets to you
            </h2>
            <div className="mt-6 space-y-3">
              {delivery.map((o) => {
                const ok = cityQualifies(o, city)
                const on = chosen?.id === o.id
                return (
                  <label
                    key={o.id}
                    className={`mat-btn flex items-start gap-3 rounded-2xl border p-4 ${
                      on ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--border)] bg-white"
                    } ${ok ? "cursor-pointer hover:border-[var(--foreground)]/25" : "cursor-not-allowed opacity-50"}`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value={o.id}
                      checked={on}
                      disabled={!ok}
                      onChange={() => setMethod(o.id)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="font-display" style={{ fontWeight: 700 }}>
                          {o.label}
                        </span>
                        <span className="font-display" style={{ fontWeight: 700 }}>
                          {o.fee > 0 ? money(o.fee) : "Free"}
                        </span>
                      </span>
                      <span className="mt-1 block text-sm text-[var(--muted)]">{o.detail}</span>
                      {!ok && (
                        <span className="mt-1.5 block text-xs font-semibold tracking-wide text-amber-600 uppercase">
                          {city
                            ? `Not available in ${city}`
                            : "Choose your city to see if this is available"}
                        </span>
                      )}
                      {ok && o.link && (
                        <a
                          href={o.link}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1.5 inline-block text-xs text-[var(--primary)] underline-offset-4 hover:underline"
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

          <section className="rounded-3xl bg-[var(--surface-2)] p-6 sm:p-8">
            <h2 className="font-display text-lg" style={{ fontWeight: 700 }}>
              How you&rsquo;ll pay
            </h2>
            <p className="mt-2 leading-relaxed text-[var(--muted)]">
              Bank transfer or mobile wallet. Place the order first — the next page gives you the
              account details and your order number, and you send the receipt to us on WhatsApp.
              Nothing is charged automatically and we start the build once the transfer lands.
            </p>
          </section>
        </div>

        <aside className="space-y-4 rounded-3xl bg-white p-6 shadow-[var(--shadow-2)] lg:sticky lg:top-28">
          <h2 className="font-display text-lg" style={{ fontWeight: 700 }}>
            Your order
          </h2>

          <ul className="space-y-3">
            {priced.map((l) => (
              <li key={l.key} className="flex gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-2)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={l.image}
                    alt={l.name}
                    loading="lazy"
                    style={{ backgroundColor: "#eceae7" }}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{l.name}</p>
                  <p className="text-xs font-semibold tracking-wide text-[var(--primary)] uppercase">
                    {l.kind === "display" ? l.variantLabel : FORMAT_LABELS[l.format as FormatKey]} × {l.qty}
                  </p>
                  {l.unavailable && (
                    <p className="mt-1 text-xs text-amber-600">This one is {l.unavailable}.</p>
                  )}
                </div>
                <span className={`font-display text-sm font-bold ${l.unavailable ? "text-[var(--muted)] line-through" : ""}`}>
                  {money(l.unitPrice * l.qty)}
                </span>
              </li>
            ))}
          </ul>

          {repriced.length > 0 && (
            <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--muted)]">
              Prices have changed since you added {repriced.length === 1 ? "that build" : "those builds"}
              . The figures above are current.
            </p>
          )}

          <div className="space-y-2 border-t border-[var(--border)] pt-4">
            <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
              <span className="min-w-0 truncate">{chosen?.label ?? "Delivery"}</span>
              <span className="shrink-0 text-[var(--foreground)]">{shipping > 0 ? money(shipping) : "Free"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-display" style={{ fontWeight: 700 }}>
                Total
              </span>
              <span className="font-display text-xl" style={{ fontWeight: 800 }}>
                {money(total)}
              </span>
            </div>
          </div>

          {blocked.length > 0 && (
            <p className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Remove the unavailable {blocked.length === 1 ? "item" : "items"} from your cart to carry on.</span>
            </p>
          )}

          {error && (
            <p className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/10 p-3 text-sm text-[var(--primary-deep)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || blocked.length > 0}
            className="mat-btn flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] py-3.5 font-display text-white shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-[var(--shadow-1)] disabled:hover:brightness-100"
            style={{ fontWeight: 700 }}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Placing your order…" : "Place order"}
          </button>
          <p className="text-center text-xs text-[var(--muted)]">
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
        className="mat-btn inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--muted)] uppercase hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Keep shopping
      </Link>
      <h1 className="font-display mt-4 mb-10 text-4xl tracking-tight md:text-5xl" style={{ fontWeight: 800 }}>
        Checkout
      </h1>
      {children}
    </div>
  )
}
