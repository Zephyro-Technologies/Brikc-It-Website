"use client"

import { useState } from "react"
import Lightbox from "./Lightbox"

/**
 * The photograph at the top of a homepage review card, when the reviewer sent
 * one. The card crops it to a band; a tap opens it whole, and the arrows move
 * through the rest of what that reviewer sent.
 */
export default function ReviewPhotos({ photos, name }: { photos: string[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null)
  if (photos.length === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(0)}
        aria-label={`Open photo from ${name} full size`}
        className="group block w-full cursor-zoom-in overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[0]}
          alt={`Photo from ${name}`}
          loading="lazy"
          className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {photos.length > 1 && (
          <span className="absolute right-3 bottom-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
            1 / {photos.length}
          </span>
        )}
      </button>
      {open !== null && (
        <Lightbox
          images={photos}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
          label={`Photo from ${name}`}
        />
      )}
    </>
  )
}
