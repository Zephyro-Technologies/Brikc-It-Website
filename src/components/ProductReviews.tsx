"use client"

import { useRef, useState } from "react"
import { BadgeCheck, PenLine, Star } from "lucide-react"
import type { Review } from "../data"
import ReviewForm from "./ReviewForm"

/**
 * What people said about this build, and the way in to saying something.
 *
 * The form used to sit open on the page, which put a seven-field form asking
 * for an order number in front of everybody — including the overwhelming
 * majority who came to read rather than write. It is behind a button now, and
 * the reviews come first, because that is what the section is for.
 */
export default function ProductReviews({
  slug,
  name,
  reviews,
}: {
  slug: string
  name: string
  reviews: Review[]
}) {
  const [writing, setWriting] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  function openForm() {
    setWriting(true)
    // Opened from the bottom of a long page, the form can appear below the
    // fold — scroll to it rather than leaving the button looking like it did
    // nothing. After paint, so there is something to scroll to.
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
    )
  }

  return (
    <div>
      {reviews.length > 0 ? (
        <ul className="flex flex-col gap-6">
          {reviews.map((review, i) => (
            <li key={`${review.name}-${i}`} className="border-b border-[var(--border)] pb-6 last:border-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <Stars rating={review.rating} />
                {review.verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--muted)]">
                    <BadgeCheck className="h-3.5 w-3.5 text-[var(--primary)]" />
                    Verified purchase
                  </span>
                )}
              </div>
              <blockquote className="mt-3 text-lg leading-relaxed text-[var(--foreground)]">
                &ldquo;{review.text}&rdquo;
              </blockquote>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {review.name}
                {review.handle ? ` · ${review.handle}` : ""}
              </p>
              {review.media.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-3">
                  {review.media.map((m) => (
                    <li key={m.url}>
                      {m.kind === "video" ? (
                        // eslint-disable-next-line jsx-a11y/media-has-caption
                        <video
                          src={m.url}
                          controls
                          preload="metadata"
                          className="h-28 rounded-xl bg-black"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.url}
                          alt={`Photo from ${review.name}`}
                          loading="lazy"
                          className="h-28 w-28 rounded-xl object-cover"
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[var(--muted)]">
          No reviews of this build yet. If you have one, yours would be the first.
        </p>
      )}

      {writing ? (
        <div ref={formRef} className="mt-8">
          <ReviewForm slug={slug} name={name} />
        </div>
      ) : (
        <button
          type="button"
          onClick={openForm}
          className="mat-btn mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-6 py-3 text-sm font-semibold shadow-[var(--shadow-1)] hover:bg-[var(--surface-2)]"
        >
          <PenLine className="h-4 w-4 text-[var(--primary)]" />
          Write a review
        </button>
      )}
    </div>
  )
}

/** Five stars, the earned ones filled. 1–5; the database refuses anything else. */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className={`h-4 w-4 ${
            n <= rating
              ? "fill-[var(--primary)] text-[var(--primary)]"
              : "fill-[var(--border)] text-[var(--border)]"
          }`}
        />
      ))}
    </div>
  )
}
