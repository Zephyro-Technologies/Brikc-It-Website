"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import { useCart } from "../cart"
import { money } from "../lib/money"
import type { Product } from "../data"
import {
  cardTag,
  cheapestVariant,
  displayVisual,
  fromPrice,
  isSellable,
  lowStockNote,
  subline,
} from "../lib/product-view"
import { useShopSettings } from "../lib/shop-settings"

/**
 * A display's card on /displays and the homepage preview — the display
 * equivalent of ui.tsx's ProductCard. A display has no single cheapest
 * format to quick-add, so the add chip here reaches for cheapestVariant()
 * instead, and a display with nothing sellable gets neither a price nor a
 * button rather than one that would fail at checkout.
 */
export function DisplayCard({ product }: { product: Product }) {
  const { lowStockAt } = useShopSettings()
  const tag = cardTag(product)
  const sellable = isSellable(product)
  const visual = displayVisual(product)
  // A display's count is the sum of its sizes, which is the right number for a
  // card — the detail page narrows it to the size actually chosen.
  const running = sellable ? lowStockNote(product, lowStockAt) : null

  return (
    <Link
      href={`/displays/${product.slug}`}
      className="mat-btn group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-1)] hover:-translate-y-1 hover:shadow-[var(--shadow-2)]"
    >
      <div className="relative overflow-hidden">
        {visual.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={visual.value}
            alt={product.name}
            loading="lazy"
            style={{ backgroundColor: "#eceae7" }}
            className={`aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              sellable ? "" : "opacity-60"
            }`}
          />
        ) : (
          <span
            aria-hidden
            className={`block aspect-square w-full ${sellable ? "" : "opacity-60"}`}
            style={{ background: visual.value }}
          />
        )}
        {tag && (
          <span
            className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-bold shadow-[var(--shadow-1)] ${
              sellable ? "bg-white/90 text-[var(--primary)]" : "bg-[var(--foreground)] text-white"
            }`}
          >
            {tag}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base leading-snug" style={{ fontWeight: 700 }}>
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-[var(--muted)]">{subline(product)}</p>
        {running && <p className="mt-1.5 text-xs font-semibold text-[var(--primary)]">{running}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          {/* No sellable size means no price to advertise. */}
          {sellable ? (
            <span className="font-bold">
              <span className="text-xs font-normal text-[var(--muted)]">from </span>
              {money(fromPrice(product))}
            </span>
          ) : (
            <span className="text-sm font-semibold text-[var(--muted)]">Not available</span>
          )}
          {sellable && <DisplayAddButton product={product} />}
        </div>
      </div>
    </Link>
  )
}

/** Quick-add the cheapest in-stock size — the display counterpart of ui.tsx's AddButton. */
function DisplayAddButton({ product }: { product: Product }) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!added) return
    const t = window.setTimeout(() => setAdded(false), 1400)
    return () => window.clearTimeout(t)
  }, [added])

  const variant = cheapestVariant(product)
  if (!variant) return null

  return (
    <button
      type="button"
      onClick={(e) => {
        // The card is a link — adding must not navigate to the detail page.
        e.preventDefault()
        e.stopPropagation()
        add(product, { variant }, 1, { open: false })
        setAdded(true)
      }}
      aria-label={`Add ${product.name} to cart`}
      className={`mat-btn flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold ${
        added
          ? "bg-emerald-600 text-white"
          : "bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--primary)] hover:text-white"
      }`}
    >
      {added ? (
        <>
          <Check className="h-3.5 w-3.5" /> Added
        </>
      ) : (
        "+ Add"
      )}
    </button>
  )
}
