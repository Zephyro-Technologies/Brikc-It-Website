"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { useCart } from "../cart"
import { money } from "../lib/money"
import type { Product } from "../data"
import {
  cardTag,
  cheapestFormat,
  cheapestVariant,
  displayVisual,
  fromPrice,
  isSellable,
  subline,
} from "../lib/product-view"

/**
 * The shared vocabulary of the storefront: reveal-on-scroll, section headings,
 * the explore pill, the quick-add chip and the product card. Every page builds
 * from these, so a change here is a change everywhere — which is the point.
 */

/**
 * Fades its children up as they scroll into view.
 *
 * `.reveal` starts at opacity 0, so anything wrapped in this is INVISIBLE until
 * the observer fires. That is fine in a browser and fine for crawlers (the
 * markup is all there, prerendered), but it does mean a Reveal around something
 * always above the fold just costs a frame. Honours prefers-reduced-motion via
 * the stylesheet, which pins .reveal visible.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // No IntersectionObserver (old browser, odd runtime) means never revealing,
    // so show it straight away rather than hiding content behind a feature test.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/** Heading block with an optional action on the right. `dark` for the black bands. */
export function SectionHead({
  kicker,
  title,
  desc,
  dark = false,
  action,
}: {
  kicker?: string
  title: string
  desc: string
  dark?: boolean
  action?: ReactNode
}) {
  return (
    <div className="mb-8">
      {kicker && (
        <span
          className={`text-xs font-bold tracking-[0.2em] uppercase ${
            dark ? "text-[var(--primary-2)]" : "text-[var(--primary)]"
          }`}
        >
          {kicker}
        </span>
      )}
      {/* The action sits on the title's line, not down beside the description. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <h2 className="font-display text-4xl tracking-tight sm:text-5xl" style={{ fontWeight: 800 }}>
          {title}
        </h2>
        {action && <div className="flex-none">{action}</div>}
      </div>
      <p className={`mt-3 max-w-2xl text-lg ${dark ? "text-white/60" : "text-[var(--muted)]"}`}>
        {desc}
      </p>
    </div>
  )
}

/** The dark pill that sends you to the full version of a previewed section. */
export function ExploreMore({ to, label = "Explore more" }: { to: string; label?: string }) {
  return (
    <Link
      href={to}
      className="mat-btn inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-1)] hover:bg-black hover:shadow-[var(--shadow-2)]"
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  )
}

/**
 * Quick-add from a grid. Adds the cheapest format on sale — the one the card's
 * "from" price names — so the price you read is the price you get. A build
 * that's sold out, or sold in no format at all, gets no chip.
 */
export function AddButton({ product, className = "" }: { product: Product; className?: string }) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!added) return
    const t = window.setTimeout(() => setAdded(false), 1400)
    return () => window.clearTimeout(t)
  }, [added])

  if (!isSellable(product)) return null

  // isSellable() already guarantees a sold format (model) or an in-stock
  // variant (display) exists, so the non-null assertion here can't fire.
  const choice =
    product.kind === "display" ? { variant: cheapestVariant(product)! } : { format: cheapestFormat(product) }

  return (
    <button
      type="button"
      onClick={(e) => {
        // The card is a link — adding must not navigate to the product page.
        e.preventDefault()
        e.stopPropagation()
        add(product, choice, 1, { open: false })
        setAdded(true)
      }}
      aria-label={`Add ${product.name} to cart`}
      className={`mat-btn flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold ${
        added
          ? "bg-emerald-600 text-white"
          : "bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--primary)] hover:text-white"
      } ${className}`}
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

export function ProductCard({ product }: { product: Product }) {
  const tag = cardTag(product)
  const soldOut = !isSellable(product)
  const visual = displayVisual(product)
  const href = product.kind === "display" ? `/displays/${product.slug}` : `/shop/${product.slug}`

  return (
    <Link
      href={href}
      className="mat-btn group flex flex-col overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-1)] hover:-translate-y-1 hover:shadow-[var(--shadow-2)]"
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
              soldOut ? "opacity-60" : ""
            }`}
          />
        ) : (
          <div
            aria-hidden="true"
            style={{ background: visual.value || "#eceae7" }}
            className={`aspect-square w-full transition-transform duration-500 group-hover:scale-105 ${
              soldOut ? "opacity-60" : ""
            }`}
          />
        )}
        {tag && (
          <span
            className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-bold shadow-[var(--shadow-1)] ${
              soldOut ? "bg-[var(--foreground)] text-white" : "bg-white/90 text-[var(--primary)]"
            }`}
          >
            {tag}
          </span>
        )}
        <span className="absolute top-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
          {product.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base leading-snug" style={{ fontWeight: 700 }}>
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-[var(--muted)]">{subline(product)}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          {/* A build nobody can buy doesn't get to advertise a price. */}
          {soldOut ? (
            <span className="text-sm font-semibold text-[var(--muted)]">Not available</span>
          ) : (
            <span className="font-bold">
              <span className="text-xs font-normal text-[var(--muted)]">from </span>
              {money(fromPrice(product))}
            </span>
          )}
          <AddButton product={product} />
        </div>
      </div>
    </Link>
  )
}

/**
 * What a section shows when it has nothing in it yet.
 *
 * Sections used to vanish when empty, which reads as a page missing a piece
 * rather than a shop still filling up. Saying so plainly is better than a gap,
 * and better than advertising things nobody can buy.
 */
export function ComingSoon({ note, onDark = false }: { note?: string; onDark?: boolean }) {
  return (
    <div
      className={`rounded-3xl px-6 py-16 text-center ${
        onDark
          ? "border border-white/10 bg-white/[0.03]"
          : "border border-[var(--border)] bg-white shadow-[var(--shadow-1)]"
      }`}
    >
      <p className="font-display text-2xl" style={{ fontWeight: 800 }}>
        Coming soon
      </p>
      {note && (
        <p className={`mx-auto mt-2 max-w-sm ${onDark ? "text-white/60" : "text-[var(--muted)]"}`}>
          {note}
        </p>
      )}
    </div>
  )
}
