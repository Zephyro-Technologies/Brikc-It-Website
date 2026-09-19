"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Check, ChevronLeft, ChevronRight, Package, ShieldCheck, Truck, X } from "lucide-react"
import { useCart } from "../cart"
import { money } from "../lib/money"
import { FORMAT_LABELS, embedUrl, priceOf, type FormatKey, type Product } from "../data"
import { Markdown } from "../lib/markdown"
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
  const [lightbox, setLightbox] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  // Off until the shopper asks for it, so the price on screen is the base price
  // until they choose otherwise.
  const [framed, setFramed] = useState(false)
  const [tab, setTab] = useState<"description" | "specs">("description")
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const { add } = useCart()

  const images = product?.images ?? []
  const count = images.length

  /**
   * Four other builds, picked at random.
   *
   * This page is prerendered, so shuffling on the server would freeze one
   * arrangement into the HTML and show every visitor the same four until
   * something revalidated it — not random at all. The shuffle therefore happens
   * in the browser, and the FIRST render deliberately matches the server's
   * HTML: picking differently on that render is a hydration mismatch, and React
   * would throw it away and warn.
   */
  const [shuffled, setShuffled] = useState<Product[]>(() => suggestions.slice(0, 4))

  useEffect(() => {
    const pool = [...suggestions]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    setShuffled(pool.slice(0, 4))
    // Keyed on the build being viewed: `suggestions` is a fresh array on every
    // parent render, and depending on it directly would reshuffle constantly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.slug])

  const step = useCallback(
    (by: number) => setActiveImg((i) => (count === 0 ? 0 : (i + by + count) % count)),
    [count],
  )

  // Arrow keys move through the photographs while the full-size view is open,
  // and Escape closes it — the things a keyboard expects of a lightbox.
  // Focus moves into the overlay when it opens and back to whatever opened it
  // when it closes. Without this a keyboard is left behind on the page under a
  // full-screen dialog, tabbing through things it cannot see.
  useEffect(() => {
    if (!lightbox) {
      openerRef.current?.focus()
      openerRef.current = null
      return
    }
    openerRef.current = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
  }, [lightbox])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false)
      if (e.key === "ArrowLeft") step(-1)
      if (e.key === "ArrowRight") step(1)
    }
    window.addEventListener("keydown", onKey)
    // The page behind a full-screen overlay should not scroll under it.
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = previous
    }
  }, [lightbox, step])

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
  // A frame sits on top of whichever assembly was chosen, so an unassembled kit
  // can be bought with the frame to put it in later.
  const withFrame = framed && product.frame.offered
  const total = priceOf(product, activeFormat, withFrame)

  // Both assemblies come off the same kit, so one count caps the quantity
  // whichever is chosen — and a frame does not consume another one. place_order refuses more than this anyway; stopping the
  // stepper is how the shopper finds out before the checkout, not at it.
  const maxQty = Math.min(10, Math.max(1, product.stock))

  const onAdd = () => {
    if (!canAdd) return
    add(product, { format: activeFormat, framed: withFrame }, qty)
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
          <div className="group relative overflow-hidden rounded-[28px] shadow-[var(--shadow-2)]">
            {/* A build with no photograph has nothing to enlarge, and opening
                an empty overlay would lock the page's scroll behind something
                invisible. */}
            <button
              type="button"
              onClick={() => count > 0 && setLightbox(true)}
              disabled={count === 0}
              aria-label={`Open ${product.name} full size`}
              className="block w-full cursor-zoom-in disabled:cursor-default"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={productImage(product, activeImg)}
                alt={product.name}
                loading="lazy"
                style={{ backgroundColor: "#eceae7" }}
                className="aspect-square w-full object-cover"
              />
            </button>

            {/* Arrows only earn their place when there is somewhere to go. On a
                touch screen they stay visible; on a pointer they fade in, so
                they don't sit over the photograph the whole time. */}
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous image"
                  className="mat-btn absolute top-1/2 left-3 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[var(--foreground)] shadow-[var(--shadow-2)] backdrop-blur transition-opacity hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next image"
                  className="mat-btn absolute top-1/2 right-3 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[var(--foreground)] shadow-[var(--shadow-2)] backdrop-blur transition-opacity hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="absolute right-3 bottom-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                  {activeImg + 1} / {count}
                </span>
              </>
            )}
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

          {/* The frame is a separate question from how assembled it arrives, so
              it gets its own control rather than a third chip above. Priced on
              its own too, so what it costs is visible instead of buried in a
              bundle. */}
          {product.frame.offered && (
            <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-3.5">
              <input
                type="checkbox"
                checked={framed}
                onChange={(e) => setFramed(e.target.checked)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              <span className="flex-1 text-sm">
                <span className="font-semibold">Add an LED display frame</span>
                <span className="block text-[var(--muted)]">
                  Mounted and lit, ready for the wall.
                </span>
              </span>
              <span className="font-semibold whitespace-nowrap">+ {money(product.frame.price)}</span>
            </label>
          )}

          <div className="mt-4 text-3xl font-bold">{money(total)}</div>

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

        </Reveal>
      </div>

      {/* Everything there is to read sits below the fold, behind two tabs, so
          the top of the page stays about choosing and buying. */}
      <Reveal className="mt-16">
        <div className="border-b border-[var(--border)]">
          <div className="flex gap-1">
            {(["description", "specs"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-selected={tab === t}
                role="tab"
                className={`mat-btn -mb-px border-b-2 px-5 py-3 text-sm font-semibold ${
                  tab === t
                    ? "border-[var(--primary)] text-[var(--foreground)]"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {t === "description" ? "Description" : "Specification"}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-7">
          {tab === "description" ? (
            <Markdown
              text={product.description}
              className="max-w-3xl text-lg leading-relaxed text-[var(--muted)]"
            />
          ) : (
            <dl className="grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)]">
              {specs(product).map((row) => (
                <div key={row.label} className="bg-white p-4">
                  <dt className="text-xs font-semibold tracking-wider text-[var(--muted)] uppercase">
                    {row.label}
                  </dt>
                  <dd className="mt-1 font-semibold">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </Reveal>

      {product.videos.length > 0 && (
        <Reveal className="mt-14">
          <h2 className="font-display mb-6 text-2xl" style={{ fontWeight: 700 }}>
            {product.videos.length === 1 ? "Video" : "Videos"}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {product.videos.map((video, i) => {
              const embed = embedUrl(video)
              return (
                <figure key={i} className="overflow-hidden rounded-3xl shadow-[var(--shadow-1)]">
                  <div className="aspect-video bg-black">
                    {embed ? (
                      <iframe
                        src={embed}
                        title={video.title || `${product.name} video ${i + 1}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    ) : (
                      // An uploaded file plays from storage. No autoplay: a
                      // product page that starts making noise is a page people
                      // close.
                      <video src={video.src} controls preload="metadata" className="h-full w-full">
                        Your browser can&apos;t play this video.
                      </video>
                    )}
                  </div>
                  {video.title && (
                    <figcaption className="bg-white px-4 py-3 text-sm text-[var(--muted)]">
                      {video.title}
                    </figcaption>
                  )}
                </figure>
              )
            })}
          </div>
        </Reveal>
      )}

      {shuffled.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display mb-6 text-2xl" style={{ fontWeight: 700 }}>
            More builds
          </h2>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {shuffled.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Deliberately outside every Reveal: .reveal starts at opacity 0 and only
          becomes visible when it scrolls into view, which a fixed overlay never
          does — it would open invisible. */}
      {lightbox && count > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name}, image ${activeImg + 1} of ${count}`}
          onClick={() => setLightbox(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
        >
          <button
            ref={closeRef}
            type="button"
            onClick={() => setLightbox(false)}
            aria-label="Close"
            className="mat-btn absolute top-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  step(-1)
                }}
                aria-label="Previous image"
                className="mat-btn absolute top-1/2 left-4 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  step(1)
                }}
                aria-label="Next image"
                className="mat-btn absolute top-1/2 right-4 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={productImage(product, activeImg)}
            alt={product.name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-full rounded-2xl object-contain"
          />

          {count > 1 && (
            <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
              {activeImg + 1} / {count}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
