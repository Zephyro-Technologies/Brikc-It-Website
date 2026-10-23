"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, ChevronDown, Loader2, ShoppingBag, Tag, X } from "lucide-react"
import { lineLabel, useCart } from "../cart"
import { money } from "../lib/money"
import {
  FORMAT_LABELS,
  cityQualifies,
  framePrice,
  priceOf,
  type DeliveryOption,
  type FormatKey,
  type FrameChoice,
  type Product,
  type ShippingMethod,
} from "../data"
import { isSellable } from "../lib/product-view"
import { CONFIRMATION_KEY, PAY_TEST_KEY, type PaymentSession } from "../lib/checkout"
import { CURRENCY, lineParams, track } from "../lib/pixel"
import { OTHER_CITY, PROVINCES, citiesIn } from "../lib/pakistan"

// The outline is --muted at 70%, not --border: with the label inside the field
// the edge is all that shows where one is, and --border is 1.25:1 on white.
const FIELD =
  "w-full rounded-xl border border-[var(--muted)]/70 bg-white px-3.5 text-[var(--foreground)] outline-none " +
  "placeholder:text-[var(--muted)] transition-shadow focus:border-[var(--primary)] focus:ring-4 " +
  "focus:ring-[var(--primary)]/15 disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:opacity-60"

/** Room at the top of a field for the label to sit in once it has floated. */
const FLOATING = "h-[3.25rem] pt-5 pb-1"

// Sits on the field's top edge by default; drops to the middle and reads as a
// placeholder only while the field is empty and not focused. Written as one
// arbitrary variant rather than peer-placeholder-shown plus peer-focus, so the
// two never compete over which comes later in the stylesheet.
const FLOAT_LABEL =
  "pointer-events-none absolute top-1.5 left-3.5 right-3.5 truncate text-[11px] text-[var(--muted)] transition-all " +
  "peer-[:placeholder-shown:not(:focus)]:top-1/2 peer-[:placeholder-shown:not(:focus)]:-translate-y-1/2 " +
  "peer-[:placeholder-shown:not(:focus)]:text-sm"

const HINT = "mt-1 px-1 text-xs text-[var(--muted)]"

/**
 * A real <label> inside the field, Shopify-style. The input always carries a
 * placeholder — a single space when there is no example to show — because
 * :placeholder-shown is how the label knows the field is empty; the example
 * itself stays invisible until focus, when the label has moved out of its way.
 */
function Field({
  label,
  id,
  value,
  onChange,
  hint,
  placeholder,
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
      <div className="relative">
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? " "}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`peer ${FIELD} ${FLOATING} placeholder:text-transparent focus:placeholder:text-[var(--muted)]`}
          {...rest}
        />
        <label htmlFor={id} className={FLOAT_LABEL}>
          {label}
        </label>
      </div>
      {hint && (
        <p id={`${id}-hint`} className={HINT}>
          {hint}
        </p>
      )}
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
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          required={required}
          // The hint is the only thing that says why the city is disabled.
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={(e) => onChange(e.target.value)}
          // appearance-none drops the native arrow, so one is drawn below —
          // without it the control reads as a text box that won't accept typing.
          className={`${FIELD} ${FLOATING} appearance-none pr-10`}
        >
          {children}
        </select>
        {/* Always floated: a select is never empty, it shows its first option. */}
        <label htmlFor={id} className="pointer-events-none absolute top-1.5 left-3.5 text-[11px] text-[var(--muted)]">
          {label}
        </label>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
      </div>
      {hint && (
        <p id={`${id}-hint`} className={HINT}>
          {hint}
        </p>
      )}
    </div>
  )
}

/** Joined rows: one rounded box, a hairline between rows, the chosen one tinted. */
const ROWS = "divide-y divide-[var(--border)] rounded-xl border border-[var(--muted)]/70 bg-white"

function rowTint(on: boolean) {
  // first:/last: round the row itself, so the inset outline of a chosen first
  // or last row follows the box's corner instead of being clipped square.
  return `px-4 py-3.5 first:rounded-t-xl last:rounded-b-xl ${
    on ? "bg-[var(--primary)]/5 ring-1 ring-[var(--primary)] ring-inset" : ""
  }`
}

function rowClass(on: boolean) {
  return `flex items-start gap-3 ${rowTint(on)}`
}

export default function CheckoutView({
  products,
  ordersOpen,
  instagram,
  delivery,
  gateway,
}: {
  products: Product[]
  /** False when no payment details are set — see canCheckout(). */
  ordersOpen: boolean
  instagram: string
  delivery: DeliveryOption[]
  /** Rapid Gateway's environment, or null while online payment is off (RAPID_ENV). */
  gateway: "LIVE" | "TEST" | null
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

  // Paying online is on offer when the gateway is live, or — on its sandbox —
  // only to a browser that opened the shop with ?pay=test (PAY_TEST_KEY).
  // Worked out after mount: it reads the URL and sessionStorage, which the
  // server render has neither of.
  const [canPayOnline, setCanPayOnline] = useState(false)
  const [payBy, setPayBy] = useState<"online" | "transfer">("transfer")
  useEffect(() => {
    let allowed = gateway === "LIVE"
    if (gateway === "TEST") {
      try {
        if (new URLSearchParams(window.location.search).get("pay") === "test") {
          sessionStorage.setItem(PAY_TEST_KEY, "1")
        }
        allowed = sessionStorage.getItem(PAY_TEST_KEY) === "1"
      } catch {
        allowed = false
      }
    }
    setCanPayOnline(allowed)
    if (allowed) setPayBy("online")
  }, [gateway])
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
      if (l.kind === "bundle") {
        // Priced from the bundle's own number, and unavailable the moment any
        // member stops being orderable — which is what isSellable() checks and
        // what place_order would refuse. Catching it here turns a server error
        // at the last step into something the shopper can fix in the cart.
        const unavailable = !product.inStock
          ? "sold out"
          : !isSellable(product)
            ? "no longer available as a bundle"
            : l.qty > product.stock
              ? `down to ${product.stock} — lower the quantity`
              : null
        const unitPrice = product.bundlePrice
        return { ...l, unitPrice, unavailable, changed: !unavailable && unitPrice !== l.unitPrice }
      }
      if (l.kind === "display") {
        const variant = product.variants.find((v) => v.id === l.variantId)
        // A cart can sit in localStorage for a week while the shelf empties, so
        // the quantity is checked against the count as well. place_order refuses
        // the line either way; catching it here turns a server error at the last
        // step into something the shopper can fix in the cart.
        const unavailable = !variant
          ? "that size is no longer available"
          : !variant.inStock
            ? "sold out"
            : l.qty > variant.stock
              ? `down to ${variant.stock} — lower the quantity`
              : null
        const unitPrice = variant ? variant.price : l.unitPrice
        return { ...l, unitPrice, unavailable, changed: !unavailable && unitPrice !== l.unitPrice }
      }
      const format = l.format as FormatKey
      const frame: FrameChoice = l.frame ?? "none"
      const unavailable = !product.inStock
        ? "sold out"
        : !product.formats[format]
          ? `no longer sold ${FORMAT_LABELS[format].toLowerCase()}`
          : frame !== "none" && framePrice(product, frame) <= 0
            ? "no longer sold with that frame"
            : l.qty > product.stock
              ? `down to ${product.stock} — lower the quantity`
              : null
      // Recomputed from the live catalogue, frame included. The stored unitPrice
      // is last week's; this is the number the database will actually charge.
      const unitPrice = priceOf(product, format, frame)
      return { ...l, unitPrice, unavailable, changed: !unavailable && unitPrice !== l.unitPrice }
    })
  }, [lines, products])

  const blocked = priced.filter((l) => l.unavailable)
  const repriced = priced.filter((l) => l.changed)

  // The phone's summary is the only place that says which line is unavailable
  // or that prices moved, so it opens itself when there is something to read.
  useEffect(() => {
    if (blocked.length > 0 || repriced.length > 0) setSummaryOpen(true)
  }, [blocked.length, repriced.length])
  const subtotal = priced.reduce((n, l) => (l.unavailable ? n : n + l.unitPrice * l.qty), 0)

  // Once per visit, when the cart — which fills in after mount — first has
  // something in it, and only when ordering is open: a shut checkout isn't one.
  const checkoutTracked = useRef(false)
  useEffect(() => {
    if (checkoutTracked.current || !ordersOpen || priced.length === 0) return
    checkoutTracked.current = true
    track("InitiateCheckout", { ...lineParams(priced), value: subtotal, currency: CURRENCY })
  }, [ordersOpen, priced, subtotal])

  /**
   * The cart as the server sees it — the one shape sent both to price a coupon
   * and to place the order, so a discount can never be quoted against a
   * different cart from the one that gets charged.
   */
  const wire = useMemo(
    () =>
      priced.map((l) =>
        l.kind === "bundle"
          ? { slug: l.slug, qty: l.qty }
          : l.kind === "display"
            ? { slug: l.slug, variant: l.variantId, qty: l.qty }
            : { slug: l.slug, format: l.format, frame: l.frame ?? "none", qty: l.qty },
      ),
    [priced],
  )

  const [couponInput, setCouponInput] = useState("")
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [checkingCoupon, setCheckingCoupon] = useState(false)
  // The code field stays behind an "Add discount" button until asked for —
  // most shoppers have no code, and an empty box reads as a missed saving.
  const [couponOpen, setCouponOpen] = useState(false)
  // The phone's summary bar starts shut; the total is on it either way.
  const [summaryOpen, setSummaryOpen] = useState(false)

  // Shown, but never the last word: place_order works the discount out again
  // from the same function, so this is a preview of that number and not a
  // second opinion about it.
  const discount = coupon?.discount ?? 0
  const total = subtotal - discount + shipping

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault()
    const code = couponInput.trim()
    if (!code || checkingCoupon) return
    setCheckingCoupon(true)
    setCouponError(null)
    try {
      const res = await fetch("/api/coupon", {
        method: "POST",
        headers: { "content-type": "application/json" },
        // The cart, not a total. What it is worth is the database's business.
        body: JSON.stringify({ code, lines: wire }),
      })
      const body = (await res.json()) as { code?: string; discount?: number; error?: string }
      if (!res.ok || !body.code) {
        setCoupon(null)
        setCouponError(body.error ?? "We couldn't check that code.")
        return
      }
      setCoupon({ code: body.code, discount: body.discount ?? 0 })
      setCouponInput("")
    } catch {
      setCouponError("Couldn't reach us just then.")
    } finally {
      setCheckingCoupon(false)
    }
  }

  function dropCoupon() {
    setCoupon(null)
    setCouponError(null)
  }

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
          // `framed` has to travel with the line: the summary above prices it in,
          // and place_order prices from what arrives here. Leaving it out quotes
          // one total and charges another — the exact disagreement the shop is
          // built to prevent. Still only a yes/no; the frame's price is the
          // database's business, not the browser's.
          lines: wire,
          shippingMethod: chosen?.id ?? "standard",
          // The code, never the amount. A code that expired while this form was
          // open is refused at this point rather than honoured.
          coupon: coupon?.code ?? "",
          paymentMethod: canPayOnline ? payBy : "transfer",
        }),
      })
      const body = (await res.json()) as {
        number?: string
        total?: number
        shipping?: number
        discount?: number
        coupon?: string
        error?: string
        payment?: PaymentSession | null
        paymentError?: string
      }
      if (!res.ok || !body.number) {
        setError(body.error ?? "We couldn't place that order.")
        return
      }

      // Placed is not bought — most orders are paid by transfer later and some
      // never are — so this is AddPaymentInfo, and Purchase comes from the
      // database when the order is marked paid (20260927140000 in the admin).
      // Reported here, the moment it happened, rather than by the confirmation
      // page, which can be reloaded and would count it again.
      track("AddPaymentInfo", { ...lineParams(priced), value: body.total ?? total, currency: CURRENCY }, body.number)

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
          // What the order was actually given, which is what place_order
          // decided — not what this page was showing a moment ago.
          discount: body.discount ?? 0,
          coupon: body.coupon ?? "",
          deliveryLabel: chosen?.label ?? "Standard delivery",
          // The payment form's session, opened by /api/orders, and the email
          // /api/pay needs to open it again.
          ...(canPayOnline &&
            payBy === "online" && {
              online: {
                email: form.email.trim(),
                ...(body.payment && { session: body.payment }),
                ...(body.paymentError && { error: body.paymentError }),
              },
            }),
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

  const itemCount = priced.reduce((n, l) => n + l.qty, 0)

  const itemList = (
    <ul className="space-y-3">
      {priced.map((l) => (
        <li key={l.key} className="flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0">
            <div className="h-full w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={l.image}
                alt={l.name}
                loading="lazy"
                style={{ backgroundColor: "#eceae7" }}
                className="h-full w-full object-cover"
              />
            </div>
            {l.qty > 1 && (
              <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--foreground)] px-1 text-[11px] font-semibold text-white">
                {l.qty}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{l.name}</p>
            <p className="text-xs text-[var(--muted)]">
              {lineLabel(l)} × {l.qty}
            </p>
            {l.unavailable && <p className="mt-0.5 text-xs text-amber-700">This one is {l.unavailable}.</p>}
          </div>
          <span className={`shrink-0 text-sm font-semibold ${l.unavailable ? "text-[var(--muted)] line-through" : ""}`}>
            {money(l.unitPrice * l.qty)}
          </span>
        </li>
      ))}
    </ul>
  )

  const repricedNote = repriced.length > 0 && (
    <p className="rounded-xl bg-[var(--surface-2)] p-3 text-xs text-[var(--muted)]">
      Prices have changed since you added {repriced.length === 1 ? "that build" : "those builds"}. The figures
      above are current.
    </p>
  )

  // It sits inside the checkout form, so Enter in the code field would place
  // the order — applyCoupon cancels that, because Enter here should price a
  // code. Rendered in both the phone and the wide layout; only one is shown.
  const couponBlock = (
    <div>
      {coupon ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 px-3 py-2.5">
          <span className="inline-flex min-w-0 items-center gap-2 text-sm">
            <Tag className="h-4 w-4 shrink-0 text-[var(--primary)]" />
            <span className="truncate font-semibold">{coupon.code}</span>
          </span>
          <span className="ml-auto shrink-0 text-sm font-semibold text-[var(--primary)]">−{money(discount)}</span>
          <button
            type="button"
            onClick={dropCoupon}
            aria-label={`Remove code ${coupon.code}`}
            className="mat-btn grid h-6 w-6 shrink-0 place-items-center rounded-full hover:bg-[var(--primary)]/15"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : couponOpen ? (
        <div className="flex gap-2">
          <input
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyCoupon(e)
            }}
            placeholder="Discount code"
            aria-label="Discount code"
            autoComplete="off"
            spellCheck={false}
            maxLength={24}
            // Opened by a tap on "Add discount", so the next thing is typing.
            autoFocus
            // min-w-0 so it gives way to Apply below 300px; 16px on a phone,
            // because iOS zooms into a focused field set smaller than that.
            className={`${FIELD} h-11 min-w-0 font-mono text-base uppercase sm:text-sm`}
          />
          <button
            type="button"
            onClick={applyCoupon}
            disabled={!couponInput.trim() || checkingCoupon}
            className="mat-btn shrink-0 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold hover:bg-[var(--surface-2)] disabled:opacity-50"
          >
            {checkingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCouponOpen(true)}
          className="mat-btn inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold hover:bg-[var(--surface-2)]"
        >
          <Tag className="h-4 w-4 text-[var(--muted)]" /> Add discount
        </button>
      )}
      {couponError && <p role="alert" className="mt-2 text-xs text-[var(--primary-deep)]">{couponError}</p>}
    </div>
  )

  const totals = (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
        <span>Subtotal · {itemCount === 1 ? "1 item" : `${itemCount} items`}</span>
        <span className="shrink-0 text-[var(--foreground)]">{money(subtotal)}</span>
      </div>
      {discount > 0 && (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="min-w-0 truncate text-[var(--muted)]">Discount · {coupon?.code}</span>
          <span className="shrink-0 font-semibold text-[var(--primary)]">−{money(discount)}</span>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
        <span className="min-w-0 truncate">{chosen?.label ?? "Delivery"}</span>
        <span className="shrink-0 text-[var(--foreground)]">{shipping > 0 ? money(shipping) : "Free"}</span>
      </div>
      <div className="flex items-center justify-between pt-1">
        <span className="font-display" style={{ fontWeight: 700 }}>
          Total
        </span>
        <span className="font-display text-xl" style={{ fontWeight: 800 }}>
          {money(total)}
        </span>
      </div>
    </div>
  )

  // Below the summary on a wide screen; on a phone it goes at the bottom of
  // the form, after the last thing filled in, with the total beside it.
  const submitBlock = (
    <>
      {blocked.length > 0 && (
        <p className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Remove the unavailable {blocked.length === 1 ? "item" : "items"} from your cart to carry on.</span>
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/10 p-3 text-sm text-[var(--primary-deep)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || blocked.length > 0}
        className="mat-btn flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-4 font-display text-white shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-[var(--shadow-1)] disabled:hover:brightness-100"
        style={{ fontWeight: 700 }}
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {busy ? "Placing your order…" : "Place order"}
      </button>
      <p className="text-center text-xs text-[var(--muted)]">
        {canPayOnline && payBy === "online"
          ? "You'll pay securely on the next page."
          : "You'll get the payment details on the next page."}
      </p>
    </>
  )

  const heading = "font-display text-lg"

  return (
    <Shell>
      {/* [&>*]:min-w-0 again: the province <select> has a min-content of 248px,
          set by its longest option ("Islamabad Capital Territory"), and a grid
          item cannot shrink below that — so every section was laid out 18px
          wider than the form at 300px and the page scrolled sideways. */}
      <form
        onSubmit={submit}
        className="grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-start lg:gap-12 [&>*]:min-w-0"
      >
        {/* A phone gets the summary as one bar across the top: what it comes
            to is read first, the items are a tap away, and the form starts
            right under it instead of under a screenful of thumbnails. */}
        <div className="-mx-5 border-y border-[var(--border)] bg-[var(--surface-2)] lg:hidden">
          <button
            type="button"
            onClick={() => setSummaryOpen((o) => !o)}
            aria-expanded={summaryOpen}
            aria-controls="order-summary"
            className="mat-btn flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
          >
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)]">
              {summaryOpen ? "Hide order summary" : "Order summary"}
              <ChevronDown className={`h-4 w-4 transition-transform ${summaryOpen ? "rotate-180" : ""}`} />
            </span>
            <span className="font-display text-lg" style={{ fontWeight: 800 }}>
              {money(total)}
            </span>
          </button>
          {/* Hidden rather than unmounted, so aria-controls always has a target. */}
          <div id="order-summary" hidden={!summaryOpen} className="space-y-4 border-t border-[var(--border)] px-5 pt-4 pb-5">
            {itemList}
            {repricedNote}
            <div className="border-t border-[var(--border)] pt-4">{totals}</div>
          </div>
        </div>

        <div className="space-y-8 lg:col-start-1 lg:row-start-1">
          <section>
            <h2 className={heading} style={{ fontWeight: 700 }}>
              Contact
            </h2>
            <div className="mt-3 grid gap-3">
              <Field label="Email" id="email" type="email" value={form.email} onChange={set("email")} required autoComplete="email" maxLength={200} hint="So we have your order on record and can reach you about it." />
              <Field label="Phone" id="phone" type="tel" value={form.phone} onChange={set("phone")} required autoComplete="tel" placeholder="03001234567" maxLength={40} />
            </div>
          </section>

          <section>
            <h2 className={heading} style={{ fontWeight: 700 }}>
              Delivery
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Full name" id="name" value={form.name} onChange={set("name")} required autoComplete="name" maxLength={120} />
              </div>
              <div className="sm:col-span-2">
                <Field label="Address" id="line1" value={form.line1} onChange={set("line1")} required autoComplete="address-line1" maxLength={200} />
              </div>
              <div className="sm:col-span-2">
                <Field label="Apartment, landmark (optional)" id="line2" value={form.line2} onChange={set("line2")} autoComplete="address-line2" maxLength={200} />
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
                    hint="We’ll check the courier reaches it before dispatch."
                  />
                </div>
              )}

              <Field label="Postcode (optional)" id="postcode" value={form.postcode} onChange={set("postcode")} autoComplete="postal-code" maxLength={20} />
            </div>
          </section>

          <section>
            <h2 id="shipping-heading" className={heading} style={{ fontWeight: 700 }}>
              Shipping method
            </h2>
            <div className={`mt-3 ${ROWS}`} role="radiogroup" aria-labelledby="shipping-heading">
              {delivery.map((o) => {
                const ok = cityQualifies(o, city)
                const on = chosen?.id === o.id
                // The link sits outside the <label>, so it is not read as part
                // of the option's name and a tap on it doesn't pick the row.
                return (
                  <div key={o.id} className={rowTint(on)}>
                    <label className={`flex items-start gap-3 ${ok ? "cursor-pointer" : "cursor-not-allowed"}`}>
                      <input
                        type="radio"
                        name="delivery"
                        value={o.id}
                        checked={on}
                        disabled={!ok}
                        onChange={() => setMethod(o.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className={`flex items-baseline justify-between gap-3 ${ok ? "" : "opacity-50"}`}>
                          <span className="text-sm font-semibold">{o.label}</span>
                          <span className="shrink-0 text-sm font-semibold">{o.fee > 0 ? money(o.fee) : "Free"}</span>
                        </span>
                        {/* The long explanation only under the chosen row: the
                            others are read by their name and price alone. */}
                        {on && <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">{o.detail}</span>}
                        {!ok && (
                          <span className="mt-1 block text-xs text-amber-700">
                            {city ? `Not available in ${city}` : "Choose your city to see if this is available"}
                          </span>
                        )}
                      </span>
                    </label>
                    {/* On every row it applies to, chosen or not, so who does the
                        delivering can be checked before picking it. ml-7 lines it
                        up with the title: the radio's 16px plus the 12px gap. */}
                    {ok && o.link && (
                      <a
                        href={o.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 ml-7 inline-block text-xs text-[var(--primary)] underline-offset-4 hover:underline"
                      >
                        Who&rsquo;s delivering &rarr;
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          <section>
            <h2 id="payment-heading" className={heading} style={{ fontWeight: 700 }}>
              Payment
            </h2>
            {canPayOnline ? (
              <div className={`mt-3 ${ROWS}`} role="radiogroup" aria-labelledby="payment-heading">
                {(
                  [
                    {
                      id: "online",
                      title: "Pay online",
                      body: "From your bank account or JazzCash / Easypaisa wallet, on the next page, through Rapid Gateway's secure form. Your order is confirmed the moment it goes through.",
                    },
                    {
                      id: "transfer",
                      title: "Bank or wallet transfer",
                      body: "The next page gives you our account details. Transfer the amount yourself and send us the receipt on WhatsApp — we start the build once it lands.",
                    },
                  ] as const
                ).map((o) => {
                  const on = payBy === o.id
                  return (
                    <label key={o.id} className={`${rowClass(on)} cursor-pointer`}>
                      <input
                        type="radio"
                        name="payBy"
                        value={o.id}
                        checked={on}
                        onChange={() => setPayBy(o.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{o.title}</span>
                        {on && <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">{o.body}</span>}
                      </span>
                    </label>
                  )
                })}
              </div>
            ) : (
              // One way to pay, so a row with nothing to choose and no radio.
              <div className={`mt-3 ${ROWS}`}>
                <div className={rowClass(true)}>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">Bank or wallet transfer</span>
                    <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">
                      Place the order first. The next page gives you the account details and your order
                      number, and you send the receipt to us on WhatsApp. Nothing is charged automatically,
                      and we start the build once the transfer lands.
                    </span>
                  </span>
                </div>
              </div>
            )}
            <p className="mt-2 text-xs text-[var(--muted)]">
              <Link href="/how-it-works" className="text-[var(--primary)] underline-offset-4 hover:underline">
                How paying works
              </Link>
            </p>
          </section>

          {/* The phone's end of the page: the code, what it all comes to, and
              the button. On a wide screen these live in the summary instead. */}
          <div className="space-y-4 border-t border-[var(--border)] pt-6 lg:hidden">
            {couponBlock}
            <div className="flex items-center gap-3">
              {priced[0] && (
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={priced[0].image} alt="" loading="lazy" className="h-full w-full object-cover" />
                </div>
              )}
              <span className="min-w-0 flex-1">
                <span className="block font-display" style={{ fontWeight: 700 }}>
                  Total
                </span>
                <span className="block text-xs text-[var(--muted)]">
                  {itemCount === 1 ? "1 item" : `${itemCount} items`}
                  {discount > 0 && ` · ${money(discount)} off`}
                  {` · ${shipping > 0 ? `${money(shipping)} delivery` : "free delivery"}`}
                </span>
              </span>
              <span className="shrink-0 font-display text-xl" style={{ fontWeight: 800 }}>
                {money(total)}
              </span>
            </div>
            {submitBlock}
          </div>
        </div>

        {/* A wide screen keeps the summary beside the form, always open and
            in view while scrolling, with the button at its foot. */}
        <aside className="hidden space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-6 lg:sticky lg:top-28 lg:col-start-2 lg:row-start-1 lg:block">
          <h2 className={heading} style={{ fontWeight: 700 }}>
            Order summary
          </h2>
          {/* Capped so a long cart can't push the button below a laptop's
              fold while the aside is pinned; pt-2 leaves room for the qty badge. */}
          <div className="max-h-[max(8rem,calc(100dvh_-_30rem))] overflow-y-auto pt-2 pr-1">{itemList}</div>
          {repricedNote}
          {couponBlock}
          <div className="border-t border-[var(--border)] pt-4">{totals}</div>
          <div className="space-y-3">{submitBlock}</div>
        </aside>
      </form>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-5 pb-16 md:pt-10 md:pb-24">
      <Link
        href="/shop"
        className="mat-btn inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--muted)] uppercase hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Keep shopping
      </Link>
      {/* Small on a phone, so the summary bar under it is in the first screen. */}
      <h1 className="font-display mt-2 mb-4 text-2xl tracking-tight md:mt-4 md:mb-10 md:text-5xl" style={{ fontWeight: 800 }}>
        Checkout
      </h1>
      {children}
    </div>
  )
}
