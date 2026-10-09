"use client"

import { useRef } from "react"
import { createPortal } from "react-dom"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { useModal } from "../lib/use-modal"

/**
 * A photograph full size, over everything: the product gallery's and a
 * review's. Mounted only while open.
 *
 * Rendered into document.body, not where it is used. Every place that opens one
 * sits inside a Reveal, and a transformed ancestor turns `position: fixed` into
 * "fixed to that ancestor" — the overlay would open the size of a review card.
 * A Reveal that hasn't faded in yet is also still at opacity 0, which would
 * hide it outright.
 *
 * Arrow keys move through the photographs, and useModal() does the rest of
 * what a keyboard expects: Escape, focus in, kept in and back out, no scrolling
 * behind.
 */
export default function Lightbox({
  images,
  index,
  onIndex,
  onClose,
  label,
}: {
  images: string[]
  index: number
  onIndex: (index: number) => void
  onClose: () => void
  /** What the photographs are of: "F1 McLaren", "Photo from Ayesha". */
  label: string
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const count = images.length
  const step = (by: number) => onIndex((index + by + count) % count)

  useModal(dialogRef, closeRef, onClose, (e) => {
    if (e.key === "ArrowLeft") step(-1)
    if (e.key === "ArrowRight") step(1)
  })

  if (count === 0) return null

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={count > 1 ? `${label}, image ${index + 1} of ${count}` : label}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
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
        src={images[index]}
        alt={label}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] max-w-full rounded-2xl object-contain"
      />

      {count > 1 && (
        <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
          {index + 1} / {count}
        </span>
      )}
    </div>,
    document.body,
  )
}
