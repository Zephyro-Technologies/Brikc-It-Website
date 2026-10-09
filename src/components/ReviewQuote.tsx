"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { useModal } from "../lib/use-modal"

/**
 * A review's words on a homepage card, cut to four lines so one long review
 * doesn't tower over the rest of the row. "Read more" appears only
 * when the cut actually happened — measured, not guessed from a character
 * count, because four lines hold a different amount on a phone and a desk — and
 * opens the whole review over the page.
 *
 * Inside a card that is itself a link there is no button — a button inside an
 * anchor is a fight the anchor wins — and the card's link goes to the build's
 * page, where every review is shown in full.
 */
export default function ReviewQuote({
  text,
  name,
  caption,
  inLink = false,
}: {
  text: string
  name: string
  caption: string
  inLink?: boolean
}) {
  const ref = useRef<HTMLQuoteElement>(null)
  const [clamped, setClamped] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setClamped(el.scrollHeight > el.clientHeight + 1)
    measure()
    // A slider card changes width with the window.
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    // And the font arrives late. Four lines in the fallback can be five in
    // Roboto without the clamped box changing size, which the observer above
    // would never hear about.
    document.fonts?.ready.then(measure)
    document.fonts?.addEventListener("loadingdone", measure)
    return () => {
      observer.disconnect()
      document.fonts?.removeEventListener("loadingdone", measure)
    }
  }, [])

  return (
    <div className="mt-4 flex-1">
      <blockquote ref={ref} className="line-clamp-4 text-lg leading-relaxed whitespace-pre-line text-[var(--foreground)]">
        &ldquo;{text}&rdquo;
      </blockquote>
      {/* Kept while the review is open: hiding the page's scrollbar for the
          overlay widens the card, the text can stop being cut, and the button
          focus is meant to return to would be gone. */}
      {(clamped || open) && !inLink && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 text-sm font-semibold text-[var(--primary)] underline-offset-2 hover:underline"
        >
          Read more
        </button>
      )}
      {open && <FullReview text={text} name={name} caption={caption} onClose={() => setOpen(false)} />}
    </div>
  )
}

function FullReview({
  text,
  name,
  caption,
  onClose,
}: {
  text: string
  name: string
  caption: string
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useModal(dialogRef, closeRef, onClose)

  // Into document.body for the reason Lightbox is: the card sits inside a
  // Reveal, and a transformed ancestor would pin this to the card.
  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Review from ${name}`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-7 shadow-[var(--shadow-3)]"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="mat-btn absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-[var(--surface-2)] hover:bg-[var(--border)]"
        >
          <X className="h-5 w-5" />
        </button>
        <blockquote className="mt-8 text-lg leading-relaxed whitespace-pre-line text-[var(--foreground)]">
          &ldquo;{text}&rdquo;
        </blockquote>
        <div className="mt-6 border-t border-[var(--border)] pt-4">
          <p className="font-semibold">{name}</p>
          {caption && <p className="mt-0.5 text-sm text-[var(--muted)]">{caption}</p>}
        </div>
      </div>
    </div>,
    document.body,
  )
}
