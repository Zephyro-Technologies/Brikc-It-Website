"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import type { StoreCategory } from "../data"

/**
 * The homepage hero: the categories' own cover images, as a carousel you can
 * drag with a finger or a mouse.
 *
 * The whole hero is a client component rather than just the backdrop, because
 * a drag has to be caught across the entire section. With the images sitting
 * in a layer behind the copy, a drag that starts on the headline — which on a
 * phone is most of the width — would never reach them.
 */

/** Long enough to look at, short enough that the next one is worth waiting for. */
const HOLD_MS = 5600

/**
 * Five covers is plenty of variety, and each is a full-bleed photograph the
 * homepage downloads. A shop with twelve categories should not ship twelve.
 */
const MAX_IMAGES = 5

/** Past this much of the width, a drag counts as a swipe rather than a wobble. */
const SWIPE_FRACTION = 0.15

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

  const frame = useRef<HTMLDivElement>(null)
  const start = useRef<{ x: number; y: number; axis: "x" | "y" | null } | null>(null)
  /**
   * The same number as `drag`, kept in a ref because state is not readable
   * synchronously. A quick flick delivers its last move and its release in one
   * tick: React has not re-rendered in between, so the release handler still
   * closes over the previous render's `drag`, and a real swipe measures as a
   * few pixels and springs back. The ref is what the decision reads; the state
   * is only what the transform renders from.
   */
  const dragX = useRef(0)
  // Bumped to restart the timer, so an advance never lands right after a drag.
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
  // Pointer events rather than touch events, so a mouse drags it too — on a
  // desktop there is no other way to move it by hand, and a carousel you can
  // only wait for is not one you control.
  function onPointerDown(e: React.PointerEvent) {
    if (slides.length < 2) return
    // A mouse drag that begins on a link should follow the link, not the
    // carousel. Everywhere else is fair game.
    if ((e.target as Element).closest?.("a, button")) return
    if (e.pointerType === "mouse" && e.button !== 0) return
    start.current = { x: e.clientX, y: e.clientY, axis: null }
  }

  function onPointerMove(e: React.PointerEvent) {
    const from = start.current
    if (!from) return
    const dx = e.clientX - from.x
    const dy = e.clientY - from.y

    // The axis is decided once, on the first few pixels, and then held. A hero
    // that steals a downward flick because it drifted sideways is a hero
    // nobody can scroll past. A mouse has no scroll to steal, so it is always
    // horizontal.
    if (from.axis === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      from.axis = e.pointerType === "mouse" || Math.abs(dx) > Math.abs(dy) ? "x" : "y"
      if (from.axis === "x") {
        setDragging(true)
        // Keeps the moves coming even if the cursor leaves the section.
        ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
      }
    }
    if (from.axis !== "x") return

    dragX.current = dx
    setDrag(dx)
  }

  function onPointerUp() {
    const from = start.current
    const moved = dragX.current
    start.current = null
    dragX.current = 0
    if (!from || from.axis !== "x") return

    const width = frame.current?.offsetWidth ?? 1
    if (Math.abs(moved) > width * SWIPE_FRACTION) go(index + (moved < 0 ? 1 : -1))
    setDrag(0)
    setDragging(false)
  }

  const offset = -index * 100
  const dragPercent = dragging && frame.current ? (drag / frame.current.offsetWidth) * 100 : 0
  const many = slides.length > 1

  return (
    <section
      ref={frame}
      /**
       * The height is set here rather than left to the copy.
       *
       * A cover is about 2.4 wide to 1 tall. Let the section be as short as its
       * text wants and it ends up nearer 3:1, and object-cover answers that by
       * cutting the top and bottom off the photograph — which reads as the
       * image being zoomed in. 42vw is 2.38:1, so on a wide screen almost
       * nothing is cropped, and the clamp keeps it sane at both extremes.
       */
      className={`relative isolate min-h-[clamp(30rem,42vw,44rem)] overflow-hidden ${
        many ? "cursor-grab touch-pan-y select-none active:cursor-grabbing" : ""
      }`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* The track slides; it does not fade. */}
      <div
        aria-hidden
        className="absolute inset-0 flex"
        style={{
          transform: `translate3d(${offset + dragPercent}%, 0, 0)`,
          transition: dragging ? "none" : "transform 600ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {slides.map((src, i) => (
          <div key={src} className="h-full w-full shrink-0">
            {/* Only the first is rendered on the server and in the first client
                pass, so the hero's largest paint is one image loading alone
                rather than five racing it. Both passes render the same markup,
                so hydration has nothing to disagree about. */}
            {(mounted || i === 0) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt=""
                // Eager, all of them, and this is not an oversight. A slide
                // sits translated off to the side, which a lazy image reads as
                // "not needed yet" — so it starts loading only as it slides in
                // and the first advance lands on an empty frame. That was
                // happening on the live site. The `mounted` gate above is what
                // protects the largest paint.
                loading="eager"
                fetchPriority={i === 0 ? "high" : "low"}
                draggable={false}
                style={{ backgroundColor: "#eceae7" }}
                className="h-full w-full select-none object-cover"
              />
            )}
          </div>
        ))}
      </div>

      {/*
        A scrim over the copy, and only over the copy.

        The old one ran at 0.93 out to 42% and still had 0.34 left at 72%,
        which is why the whole photograph looked bleached. This holds 0.88
        where the headline is, is down to 0.62 by the right-hand edge of the
        text column, and is gone entirely by 80%.

        0.62 is not an arbitrary floor. #1c1b1f body copy over the darkest part
        of a photograph needs about 0.48 of this scrim to clear AA at 4.5:1;
        0.62 gives 7:1 there and better everywhere else.

        On a phone the copy is the full width, so there is no left and right to
        separate — it runs top to bottom instead.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(250,248,246,0.82)_0%,rgba(250,248,246,0.74)_60%,rgba(250,248,246,0.52)_100%)] sm:bg-[linear-gradient(100deg,rgba(250,248,246,0.80)_0%,rgba(250,248,246,0.72)_35%,rgba(250,248,246,0.55)_48%,rgba(250,248,246,0.15)_65%,rgba(250,248,246,0)_78%)]"
      />

      {/* The blend into the next section. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[var(--background)]" />

      <div className="pointer-events-none relative mx-auto flex min-h-[inherit] max-w-7xl items-center px-4 py-20 sm:px-6 lg:py-28">
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
              it; the controls put pointer events back, so links still click. */}
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

          {many && (
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
