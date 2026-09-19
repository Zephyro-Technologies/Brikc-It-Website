"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, Package, ShieldCheck, Truck } from "lucide-react"
import { useCart } from "../cart"
import { money } from "../lib/money"
import { FORMAT_LABELS, type FormatKey, type Product } from "../data"
import { cardTag, lowStockNote, productImage, soldFormats, specs, subline } from "../lib/product-view"
import { useShopSettings } from "../lib/shop-settings"
import { ProductCard, Reveal } from "./ui"

/**
 * Shop-wide promises this store actually keeps — sourced from the same facts
 * as the banner and the homepage promise row. No UK shipping line, no counts
 * nobody can back.
 */
const REASSURANCE = [
  { icon: Truck, text: "Free courier delivery anywhere in Pakistan" },
  { icon: ShieldCheck, text: "Inspected piece-by-piece before dispatch" },
  { icon: Package, text: "Framed builds ship in reinforced crates" },
]

export default function ProductDetailView({
  product,
  suggestions,
  categorySlug = "",
}: {
  product: Product | undefined
  suggestions: Product[]
  /** Slug of the build's category, for the breadcrumb. Empty links to /shop. */
  categorySlug?: string
}) {
  const { lowStockAt } = useShopSettings()
  const available = product ? soldFormats(product) : []

  // Falls back to the first sold format rather than trusting old state — a
  // "framed" pick left over from another build must not stick on one that
  // isn't sold framed.
  const [format, setFormat] = useState<FormatKey>("framed")
  const activeFormat = available.includes(format) ? format : (available[0] ?? "boxed")

  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const { add } = useCart()

  useEffect(() => {
    if (!added) return
    const t = window.setTimeout(() => setAdded(false), 1400)
    return () => window.clearTimeout(t)
  }, [added])

  if (!product) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-32 text-center">
        <h1 className="font-display text-3xl" style={{ fontWeight: 800 }}>
          Build not found
        </h1>
        <p className="mt-3 text-[var(--muted)]">That model isn&apos;t in the collection.</p>
        <Link
          href="/shop"
          className="mat-btn mt-8 inline-flex items-center rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-2)] hover:shadow-[var(--shadow-3)]"
        >
          Back to shop
        </Link>
      </div>
    )
  }

  const canAdd = product.inStock && available.length > 0
  const tag = cardTag(product)
  const running = canAdd ? lowStockNote(product, lowStockAt) : null

  // All three formats come off the same kit, so one count caps the quantity
  // whichever is chosen. place_order refuses more than this anyway; stopping the
  // stepper is how the shopper finds out before the checkout, not at it.
  const maxQty = Math.min(10, Math.max(1, product.stock))

  const onAdd = () => {
    if (!canAdd) return
    add(product, { format: activeFormat }, qty)
    setAdded(true)
    setQty(1)
  }

  return (
    <div className="mx-auto max-w-7xl px-5 pt-10 pb-24">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
        <Link href="/shop" className="hover:text-[var(--foreground)]">
          Shop
        </Link>
        <span>/</span>
        <Link
          href={categorySlug ? `/shop?cat=${categorySlug}` : "/shop"}
          className="hover:text-[var(--foreground)]"
        >
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-[var(--foreground)]">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <Reveal>
          <div className="overflow-hidden rounded-[28px] shadow-[var(--shadow-2)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={productImage(product, activeImg)}
              alt={product.name}
              loading="lazy"
              style={{ backgroundColor: "#eceae7" }}
              className="aspect-square w-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img + i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  aria-label={`Show image ${i + 1}`}
                  className={`mat-btn h-20 w-20 overflow-hidden rounded-2xl border-2 ${
                    activeImg === i
                      ? "border-[var(--primary)]"
                      : "border-transparent hover:border-[var(--border)]"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt=""
                    loading="lazy"
                    style={{ backgroundColor: "#eceae7" }}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </Reveal>

        <Reveal delay={80}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold tracking-wider text-[var(--muted)] uppercase">
              {product.category}
            </span>
            {tag && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
                  product.inStock ? "bg-[var(--primary)]" : "bg-[var(--foreground)]"
                }`}
              >
                {tag}
              </span>
            )}
          </div>

          <h1 className="font-display mt-4 text-4xl tracking-tight sm:text-5xl" style={{ fontWeight: 800 }}>
            {product.name}
          </h1>
          <p className="mt-2 text-[var(--muted)]">{subline(product)}</p>

          {available.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {available.map((f) => {
                const on = f === activeFormat
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={`mat-btn rounded-full px-4 py-2 text-sm font-semibold ${
                      on
                        ? "bg-[var(--foreground)] text-white shadow-[var(--shadow-1)]"
                        : "bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--border)]"
                    }`}
                  >
                    {FORMAT_LABELS[f]}
                  </button>
                )
              })}
            </div>
          )}

          <div className="mt-4 text-3xl font-bold">{money(product.prices[activeFormat])}</div>

          <p className="mt-5 max-w-lg text-lg leading-relaxed text-[var(--muted)]">{product.description}</p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-[var(--border)] bg-white">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="mat-btn grid h-11 w-11 place-items-center rounded-full text-lg hover:bg-[var(--surface-2)]"
              >
                −
              </button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                disabled={qty >= maxQty}
                className="mat-btn grid h-11 w-11 place-items-center rounded-full text-lg hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={onAdd}
              disabled={!canAdd}
              className={`mat-btn rounded-full px-8 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-2)] transition-transform disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none ${
                added ? "bg-emerald-600" : "bg-[var(--primary)] hover:scale-[1.02] hover:shadow-[var(--shadow-3)]"
              }`}
            >
              {!canAdd ? (
                "Sold out"
              ) : added ? (
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4" /> Added to cart
                </span>
              ) : (
                "Add to cart"
              )}
            </button>
          </div>

          {running && (
            <p className="mt-4 text-sm font-semibold text-[var(--primary)]">{running}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--muted)]">
            {REASSURANCE.map(({ icon: Icon, text }) => (
              <span key={text} className="inline-flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-[var(--primary)]" />
                {text}
              </span>
            ))}
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)]">
            {specs(product).map((s) => (
              <div key={s.label} className="bg-white p-4">
                <dt className="text-xs font-semibold tracking-wider text-[var(--muted)] uppercase">{s.label}</dt>
                <dd className="mt-1 font-semibold">{s.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-20">
          <h2 className="font-display mb-6 text-2xl" style={{ fontWeight: 700 }}>
            You might also like
          </h2>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {suggestions.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
