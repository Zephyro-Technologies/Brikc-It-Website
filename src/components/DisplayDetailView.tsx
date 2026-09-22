"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, Package, ShieldCheck, Truck } from "lucide-react"
import { useCart } from "../cart"
import { money } from "../lib/money"
import type { Product } from "../data"
import { cardTag, displayVisual, lowVariantStockNote, specs, subline } from "../lib/product-view"
import { useShopSettings } from "../lib/shop-settings"
import { DisplayCard } from "./DisplayCard"
import { Reveal } from "./ui"

/**
 * Truthful, display-specific promises — matches DISPLAY_PROMISES in
 * content/displays.ts rather than ProductDetailView's REASSURANCE, whose
 * third line ("Framed builds ship in reinforced crates") is a claim about a
 * model's framed format, not about a frame that IS the product.
 */
const REASSURANCE = [
  { icon: Truck, text: "Free courier delivery anywhere in Pakistan" },
  { icon: ShieldCheck, text: "Inspected piece-by-piece before dispatch" },
  { icon: Package, text: "Ships mount-ready, with fixings included" },
]

export default function DisplayDetailView({
  product,
  suggestions,
}: {
  product: Product
  suggestions: Product[]
}) {
  const { lowStockAt } = useShopSettings()
  const [activeImg, setActiveImg] = useState(0)
  // Undefined until the shopper picks one; falls back to the cheapest
  // in-stock size below so the price shown always matches something addable.
  const [variantId, setVariantId] = useState<string | undefined>(undefined)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const { add } = useCart()

  useEffect(() => {
    if (!added) return
    const t = window.setTimeout(() => setAdded(false), 1400)
    return () => window.clearTimeout(t)
  }, [added])

  const variants = product.variants
  const inStockVariants = variants.filter((v) => v.inStock)
  const fallback = inStockVariants[0] ?? variants[0]
  const activeVariant = variants.find((v) => v.id === variantId) ?? fallback ?? null

  const canAdd = product.inStock && Boolean(activeVariant?.inStock)
  const tag = cardTag(product)
  const visual = displayVisual(product)
  const running = canAdd && activeVariant ? lowVariantStockNote(activeVariant, lowStockAt) : null

  // Capped by the chosen size's own count — a 40cm frame running low says
  // nothing about the 60cm on the shelf beside it.
  const maxQty = Math.min(10, Math.max(1, activeVariant?.stock ?? 1))

  const onAdd = () => {
    if (!canAdd || !activeVariant) return
    add(product, { variant: activeVariant }, qty)
    setAdded(true)
    setQty(1)
  }

  return (
    <div className="mx-auto max-w-7xl px-5 pt-10 pb-24">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
        <Link href="/displays" className="hover:text-[var(--foreground)]">
          Displays
        </Link>
        <span>/</span>
        <span className="text-[var(--foreground)]">{product.name}</span>
      </nav>

      {/* [&>*]:min-w-0 is load-bearing. A grid item defaults to min-width:auto,
          so it cannot shrink below its content's minimum — and a row holding a
          long build name pushed this column 29px past a 320px screen, taking
          the whole page into horizontal scroll. The `truncate` on those rows
          could never engage, because truncation only happens once the box is
          allowed to be narrower than its text. */}
      <div className="grid gap-10 lg:grid-cols-2 [&>*]:min-w-0">
        <Reveal>
          <div className="overflow-hidden rounded-[28px] shadow-[var(--shadow-2)]">
            {visual.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[activeImg] ?? visual.value}
                alt={product.name}
                loading="lazy"
                style={{ backgroundColor: "#eceae7" }}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <span aria-hidden className="block aspect-square w-full" style={{ background: visual.value }} />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={img + i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  aria-label={`Show image ${i + 1}`}
                  className={`mat-btn h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 ${
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
              {product.category || "Display"}
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

          {variants.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-5 text-sm leading-relaxed text-[var(--muted)]">
              This finish isn&apos;t available to order yet — sizes are being added soon.{" "}
              <Link href="/shop" className="font-semibold text-[var(--primary)] hover:underline">
                Browse the shop
              </Link>{" "}
              in the meantime.
            </div>
          ) : (
            <>
              <div className="mt-6 flex flex-wrap gap-2">
                {variants.map((v) => {
                  const on = activeVariant?.id === v.id
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={!v.inStock}
                      onClick={() => setVariantId(v.id)}
                      className={`mat-btn rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                        on
                          ? "bg-[var(--foreground)] text-white shadow-[var(--shadow-1)]"
                          : "bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--border)]"
                      }`}
                    >
                      {v.label}
                      {!v.inStock && " · Out of stock"}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 text-3xl font-bold">
                {activeVariant ? money(activeVariant.price) : "—"}
              </div>

              {/* Each size is stocked on its own shelf, so the count that
                  matters is the chosen one's, not the product's. */}
              {running && (
                <p className="mt-3 text-sm font-semibold text-[var(--primary)]">{running}</p>
              )}

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
            </>
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
              <DisplayCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
