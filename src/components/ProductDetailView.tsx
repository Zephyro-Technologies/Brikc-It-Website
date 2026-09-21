"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Check, ChevronLeft, ChevronRight, Package, ShieldCheck, Truck, X } from "lucide-react"
import { useCart } from "../cart"
import { money } from "../lib/money"
import {
  FORMAT_LABELS,
  FRAME_LABELS,
  embedUrl,
  frameChoices,
  framePrice,
  priceOf,
  type SoldFormat,
  type FrameChoice,
  type Product,
} from "../data"
import { Markdown } from "../lib/markdown"
import { cardTag, lowStockNote, productImage, soldFormats, specs, subline } from "../lib/product-view"
import { useShopSettings } from "../lib/shop-settings"
import { ProductCard, Reveal } from "./ui"
import ReviewForm from "./ReviewForm"

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

  // Nothing picked yet, rather than a format that might not be sold here: this
  // component is reused across builds, so a pick left over from one must not
  // stick on another that doesn't sell it.
  const [format, setFormat] = useState<SoldFormat | null>(null)
  const activeFormat: SoldFormat =
    format && available.includes(format) ? format : (available[0] ?? "boxed")

  const [activeImg, setActiveImg] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  // "none" until the shopper asks for a frame, so the price on screen is the
  // base price until they choose otherwise.
  const [frame, setFrame] = useState<FrameChoice>("none")
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
  // can be bought with the frame to put it in later. Falls back to no frame if
  // the one in state isn't sold on this build — the same defensiveness
  // activeFormat uses, for the same reason.
  const frames = frameChoices(product)
  const activeFrame: FrameChoice = frames.includes(frame) ? frame : "none"
  const total = priceOf(product, activeFormat, activeFrame)

  // Both assemblies come off the same kit, so one count caps the quantity
  // whichever is chosen — and a frame does not consume another one. place_order refuses more than this anyway; stopping the
  // stepper is how the shopper finds out before the checkout, not at it.
  const maxQty = Math.min(10, Math.max(1, product.stock))

  const onAdd = () => {
    if (!canAdd) return
    add(product, { format: activeFormat, frame: activeFrame }, qty)
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

        {/* One gap between the blocks, set here rather than as an mt-* on each
            of them. Eight separate margins had drifted to five different values
            as things moved around; the name and its subline stay a tight pair
            because they are one thing, not two. */}
        <Reveal delay={80} className="space-y-6">
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
            <h1
              className="font-display mt-4 w-full text-4xl tracking-tight sm:text-5xl"
              style={{ fontWeight: 800 }}
            >
              {product.name}
            </h1>
            <p className="mt-2 w-full text-[var(--muted)]">{subline(product)}</p>
          </div>

          {/* Above the choices, not below them. Pieces, scale and what a build
              is sold as are what you read to decide whether you want it at all;
              the assembly and the frame are what you pick once you have. It was
              behind a tab under the fold until recently, which put it a click
              away from the only place it matters. */}
          <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
            {specs(product).map((row, i, all) => (
              <div
                key={row.label}
                // An odd number of rows would otherwise leave the last cell
                // half-width with the grid's own background showing beside it,
                // which reads as a missing box rather than a deliberate gap.
                className={`bg-white p-4 ${
                  all.length % 2 === 1 && i === all.length - 1 ? "sm:col-span-2" : ""
                }`}
              >
                <dt className="text-xs font-semibold tracking-wider text-[var(--muted)] uppercase">
                  {row.label}
                </dt>
                <dd className="mt-1 font-semibold">{row.value}</dd>
              </div>
            ))}
          </dl>

          {available.length > 0 && (
            <div className="flex flex-wrap gap-2">
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
              it gets its own control rather than more chips above. A frame can
              be lit or not — different objects at different prices — so this is
              a choice of three, and each price is shown rather than buried in a
              bundle. */}
          {frames.length > 0 && (
            <fieldset className="rounded-2xl border border-[var(--border)] bg-white p-1.5">
              <legend className="sr-only">Display frame</legend>
              {(["none", ...frames] as FrameChoice[]).map((f) => {
                const on = activeFrame === f
                return (
                  <label
                    key={f}
                    className={`mat-btn flex cursor-pointer items-center gap-3 rounded-xl p-3 ${
                      on ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="frame"
                      value={f}
                      checked={on}
                      onChange={() => setFrame(f)}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                    <span className="flex-1 text-sm">
                      <span className="font-semibold">
                        {f === "none" ? "No frame" : FRAME_LABELS[f]}
                      </span>
                      {f === "led" && (
                        <span className="block text-[var(--muted)]">
                          Backlit, ready for the wall.
                        </span>
                      )}
                      {f === "plain" && (
                        <span className="block text-[var(--muted)]">
                          Mounted and ready to hang, unlit.
                        </span>
                      )}
                    </span>
                    <span className="font-semibold whitespace-nowrap">
                      {f === "none" ? "—" : `+ ${money(framePrice(product, f))}`}
                    </span>
                  </label>
                )
              })}
            </fieldset>
          )}

          <div className="text-3xl font-bold">{money(total)}</div>

          <div className="flex flex-wrap items-center gap-3">
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
            <p className="text-sm font-semibold text-[var(--primary)]">{running}</p>
          )}

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--muted)]">
            {REASSURANCE.map(({ icon: Icon, text }) => (
              <span key={text} className="inline-flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-[var(--primary)]" />
                {text}
              </span>
            ))}
          </div>

        </Reveal>
      </div>

      {/* The description stays below the fold, so the top of the page is about
          choosing and buying. It used to share a tab strip with the
          specification; that moved up to the buy controls, and a single panel
          is not a tab strip. */}
      {product.description.trim() && (
        <Reveal className="mt-16">
          {/* One column, because reading order is the point: paragraph, then
              the bullets under it, top to bottom. Setting it in two newspaper
              columns did fill the width, but CSS columns run down the left and
              continue at the top of the right — so a list got cut in half and
              you had to jump back up to finish it.

              The width is used by putting the heading beside the text instead
              of above it. The measure stays what it was, which is the part that
              was never wrong. */}
          <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[16rem_minmax(0,48rem)]">
            <h2
              className="font-display text-2xl lg:sticky lg:top-24 lg:self-start"
              style={{ fontWeight: 700 }}
            >
              Description
            </h2>
            <Markdown
              text={product.description}
              className="text-lg leading-relaxed text-[var(--muted)]"
            />
          </div>
        </Reveal>
      )}

      {/* Only on a build you could have bought. The database checks that far
          better than this does — it wants the order number and the email on it —
          but offering the form on something nobody can order is just a dead end. */}
      {product.kind === "model" && (
        <Reveal className="mt-16">
          <ReviewForm slug={product.slug} name={product.name} />
        </Reveal>
      )}

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
