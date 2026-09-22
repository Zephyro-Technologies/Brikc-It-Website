"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import type { StoreCategory } from "../data"

/**
 * The homepage hero: the categories' own cover images, as a carousel you can
 * swipe.
 *
 * Those covers are set in the admin and, until recently, the storefront only
 * rendered a category's name — the image was editable and rendered nowhere.
 *
 * The whole hero is a client component rather than just the backdrop, because
 * a swipe has to be caught across the entire section. With the images sitting
 * in an absolutely-positioned layer behind the text, a drag that starts on the
 * headline — which on a phone is most of the width — would never reach them.
 */

/** Long enough to look at, short enough that the next one is worth waiting for. */
const HOLD_MS = 5600

/**
 * Five covers is plenty of variety, and each is a full-bleed photograph the
 * homepage downloads. A shop with twelve categories should not ship twelve.
 */
const MAX_IMAGES = 5

/** Past this much of the width, a drag counts as a swipe rather than a wobble. */
const SWIPE_FRACTION = 0.18

export function Hero({ categories }: { categories: StoreCategory[] }) {
  const slides = useMemo(() => {
    // Deduplicated: two categories can share a cover, and sliding from an
    // image to itself reads as a stutter rather than a transition.
    const covers = [...new Set(categories.map((c) => c.image).filter(Boolean))]
    return covers.length > 0 ? covers.slice(0, MAX_IMAGES) : ["/brand/hero.jpg"]
  }, [categories])

  const [index, setIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [drag, setDrag] = useState(0)
  const [dragging, setDragging] = useState(false)
  /**
   * The same number as `drag`, kept in a ref because state is not readable
   * synchronously. A quick flick delivers its last touchmove and its touchend
   * in one tick: React has not re-rendered in between, so the end handler
   * still closes over the previous render's `drag` and a real swipe measures
   * as a few pixels and springs back. The ref is what the decision reads; the
   * state is only what the transform renders from.
   */
  const dragX = useRef(0)

  const frame = useRef<HTMLDivElement>(null)
  const start = useRef<{ x: number; y: number; locked: "x" | "y" | null } | null>(null)
  // Bumped to restart the timer, so an advance never lands right after a swipe.
  const [nudge, setNudge] = useState(0)

  useEffect(() => setMounted(true), [])

  const go = useCallback(
    (next: number) => {
      setIndex(((next % slides.length) + slides.length) % slides.length)
      setNudge((n) => n + 1)
    },
    [slides.length],
  )

  useEffect(() => {
    if (slides.length < 2) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), HOLD_MS)
    return () => clearInterval(timer)
  }, [slides.length, nudge])

  // ── Dragging ──────────────────────────────────────────────────────────────
  // The axis is decided once, on the first few pixels of movement, and then
  // held: a hero that steals a downward flick because it drifted sideways is
  // a hero nobody can scroll past.
  function onTouchStart(e: React.TouchEvent) {
    if (slides.length < 2) return
    const t = e.touches[0]
    start.current = { x: t.clientX, y: t.clientY, locked: null }
  }

  function onTouchMove(e: React.TouchEvent) {
    const from = start.current
    if (!from) return
    const t = e.touches[0]
    const dx = t.clientX - from.x
    const dy = t.clientY - from.y

    if (from.locked === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      from.locked = Math.abs(dx) > Math.abs(dy) ? "x" : "y"
      if (from.locked === "x") setDragging(true)
    }
    if (from.locked !== "x") return

    dragX.current = dx
    setDrag(dx)
  }

  function onTouchEnd() {
    const from = start.current
    const moved = dragX.current
    start.current = null
    dragX.current = 0
    if (!from || from.locked !== "x") return

    const width = frame.current?.offsetWidth ?? 1
    if (Math.abs(moved) > width * SWIPE_FRACTION) go(index + (moved < 0 ? 1 : -1))
    setDrag(0)
    setDragging(false)
  }

  const offset = -index * 100
  const dragPercent = dragging && frame.current ? (drag / frame.current.offsetWidth) * 100 : 0

  return (
    <section
      ref={frame}
      className="relative isolate overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {/* The track slides; it does not fade. `touch-pan-y` lets the page keep
          scrolling vertically while this owns the horizontal axis. */}
      <div
        aria-hidden
        className="absolute inset-0 flex touch-pan-y"
        style={{
          transform: `translate3d(${offset + dragPercent}%, 0, 0)`,
          transition: dragging ? "none" : "transform 600ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {slides.map((src, i) => (
          // Only the first is rendered on the server and in the first client
          // pass, so the hero's largest paint is one image loading alone
          // rather than five racing it. Both passes render the same markup,
          // so hydration has nothing to disagree about.
          <div key={src} className="h-full w-full shrink-0">
            {(mounted || i === 0) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt=""
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "low"}
                draggable={false}
                style={{ backgroundColor: "#eceae7" }}
                className="h-full w-full select-none object-cover"
              />
            )}
          </div>
        ))}
      </div>

      {/* Only the blend into the next section is left. The wash that used to
          sit over the whole image has gone — it was there to lift dark text
          off the photograph, and it was taking the photograph with it. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[var(--background)]" />

      <div className="pointer-events-none relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="max-w-xl" style={{ animation: "fade-up .6s ease both" }}>
          <h1
            className="font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl"
            style={{ fontWeight: 800 }}
          >
            Buy it <span className="text-[var(--primary)]">built</span>
            <br />
            or build it yourself.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-[var(--foreground)]/80">
            Museum-grade scale builds of the cars, bikes and F1 machines you love — sealed in the
            box or assembled by hand, and a display frame to put it in whenever you want one.
          </p>
          {/* The panel is pointer-events-none so a drag can start anywhere over
              it; the controls inside put them back, so links still click. */}
          <div className="pointer-events-auto mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/shop"
              className="mat-btn sheen rounded-full bg-[var(--primary)] px-7 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-2)] hover:brightness-105 hover:shadow-[var(--shadow-3)]"
            >
              Shop the collection
            </Link>
            <Link
              href="/best-sellers"
              className="mat-btn rounded-full bg-white/80 px-7 py-3.5 text-sm font-semibold text-[var(--foreground)] backdrop-blur hover:bg-white"
            >
              Best sellers
            </Link>
          </div>
          <div className="pointer-events-auto mt-8 flex flex-wrap gap-2">
            {/* Linked by slug, not name: renaming a category in the admin
                cascades to its builds but must not break a link in the wild. */}
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/shop?cat=${c.slug}`}
                className="mat-btn rounded-full border border-[var(--border)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--muted)] backdrop-blur hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                {c.name}
              </Link>
            ))}
          </div>

          {slides.length > 1 && (
            <div className="pointer-events-auto mt-10 flex items-center gap-2">
              {slides.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show background ${i + 1} of ${slides.length}`}
                  aria-current={i === index}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index
                      ? "w-7 bg-[var(--primary)]"
                      : "w-1.5 bg-[var(--foreground)]/25 hover:bg-[var(--foreground)]/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
