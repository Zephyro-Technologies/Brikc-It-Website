"use client"

import { Children, useEffect, useRef, useState, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

/**
 * The homepage's reviews in one row that slides, rather than a grid that grows
 * a new row for every review published.
 *
 * The browser does the sliding: a horizontal scroll with snap points, so a
 * finger swipes it, a trackpad scrolls it, and it lands on a card each time.
 * The arrows are for a mouse and a keyboard, and fade where there is nowhere
 * to go.
 * One card and most of the next on a phone, so it is plain that it moves; two
 * on a tablet, three on a desk.
 *
 * Every card is as tall as the tallest. That works because every card has the
 * same shape — a band at the top, photograph or not (see ReviewCard) — and
 * ReviewQuote cuts long reviews to four lines, so only a few lines of text ever
 * differ between them.
 *
 * It moves on by itself, one card every AUTO_MS, and goes back to the start at
 * the end. It holds still while the pointer is over it or focus is inside it —
 * nobody should have the review they are reading slide away — for a while after
 * somebody swipes or presses an arrow, while it is off screen or the tab is in
 * the background, and always for anyone who has asked their device to reduce
 * motion.
 */

/** How long each step of the automatic slide waits. */
const AUTO_MS = 5_000
/** How long the automatic slide keeps out of the way after somebody moves it themselves. */
const HANDS_OFF_MS = 12_000
export default function ReviewSlider({ children, label }: { children: ReactNode; label: string }) {
  const track = useRef<HTMLDivElement>(null)
  const [canBack, setCanBack] = useState(false)
  const [canOn, setCanOn] = useState(false)
  // Read by the timer, so kept in a ref: a re-render per hover would restart it.
  const hold = useRef({ hover: false, focus: false, offscreen: false, until: 0 })
  const handsOff = () => {
    hold.current.until = Date.now() + HANDS_OFF_MS
  }

  useEffect(() => {
    const el = track.current
    if (!el) return
    const update = () => {
      setCanBack(el.scrollLeft > 4)
      setCanOn(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    }
    update()
    el.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => {
      el.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [])

  // The automatic slide.
  useEffect(() => {
    const el = track.current
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const seen = new IntersectionObserver(([entry]) => {
      hold.current.offscreen = !entry.isIntersecting
    }, { threshold: 0.3 })
    seen.observe(el)
    const timer = window.setInterval(() => {
      const h = hold.current
      if (document.hidden || h.hover || h.focus || h.offscreen || Date.now() < h.until) return
      if (el.scrollLeft + el.clientWidth < el.scrollWidth - 4) step(el, 1)
      else el.scrollTo({ left: 0, behavior: "smooth" })
    }, AUTO_MS)
    return () => {
      window.clearInterval(timer)
      seen.disconnect()
    }
  }, [])

  function slide(direction: 1 | -1) {
    handsOff()
    if (track.current) step(track.current, direction)
  }

  const arrow =
    "mat-btn absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white text-[var(--foreground)] shadow-[var(--shadow-2)] hover:bg-[var(--surface-2)] aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:bg-white md:grid"
  // Both arrows stay put and fade at the ends rather than disappearing: a
  // button removed while it has focus throws a keyboard back to the top of the
  // page. aria-disabled, not disabled, because a disabled button drops focus
  // too. Neither shows when every card already fits.
  const scrolls = canBack || canOn

  return (
    <div
      className="relative"
      onMouseEnter={() => (hold.current.hover = true)}
      onMouseLeave={() => (hold.current.hover = false)}
      // Keyboard focus only. A mouse click leaves focus on the arrow it pressed,
      // and counting that would stop the row for good after one click — the
      // click already holds it for HANDS_OFF_MS.
      onFocus={(e) => (hold.current.focus = e.target.matches(":focus-visible"))}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hold.current.focus = false
      }}
    >
      {/* The padding, cancelled by the negative margin, is room for the cards'
          shadows and hover lift: a scroll container clips in both directions
          once it scrolls in one. Sideways it is the page's gutter on a phone,
          where the next card is meant to peek in, and only 8px from md up:
          wider than that, the card just out of view started inside the
          visible strip and its edge showed as a thin line at either end. */}
      <div
        ref={track}
        role="region"
        aria-label={label}
        onPointerDown={handsOff}
        onWheel={handsOff}
        onKeyDown={handsOff}
        className="-mx-4 -my-4 flex snap-x snap-mandatory scroll-px-4 gap-6 overflow-x-auto px-4 py-4 no-scrollbar sm:-mx-6 sm:scroll-px-6 sm:px-6 md:-mx-2 md:scroll-px-2 md:px-2"
      >
        {Children.map(children, (child) => (
          <div className="w-[85%] shrink-0 snap-start md:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]">
            {child}
          </div>
        ))}
      </div>

      {scrolls && (
        <>
          <button
            type="button"
            onClick={() => canBack && slide(-1)}
            aria-disabled={!canBack}
            aria-label="Previous reviews"
            className={`${arrow} -left-5`}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => canOn && slide(1)}
            aria-disabled={!canOn}
            aria-label="More reviews"
            className={`${arrow} -right-5`}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  )
}

/** One card's width and the gap after it. */
function step(el: HTMLElement, direction: 1 | -1) {
  const card = el.firstElementChild as HTMLElement | null
  if (!card) return
  const gap = parseFloat(getComputedStyle(el).columnGap) || 0
  el.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: "smooth" })
}
