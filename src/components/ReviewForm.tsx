"use client"

import { useRef, useState } from "react"
import { Check, ImagePlus, Star, Video, X } from "lucide-react"
import {
  IMAGE_TYPES,
  MAX_IMAGES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  VIDEO_TYPES,
  uploadReviewFile,
} from "../lib/supabase/upload"

/**
 * Write a review of a build you bought.
 *
 * The order number and the email on it are the whole anti-spam design: you
 * cannot review something you did not buy, and the database checks both
 * together rather than trusting anything typed here. This form validates the
 * obvious things to save a round trip, and nothing it decides is load-bearing.
 *
 * Submitting is two steps because files are: the review is written first and
 * comes back with a token, then each file goes straight to storage under that
 * token. If a file fails, the review still exists — better a review with one
 * photo missing than a lost review and a confused person.
 */
export default function ReviewForm({ slug, name: buildName }: { slug: string; name: string }) {
  const [orderNumber, setOrderNumber] = useState("")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [rating, setRating] = useState(5)
  const [quote, setQuote] = useState("")
  const [photos, setPhotos] = useState<File[]>([])
  const [video, setVideo] = useState<File | null>(null)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const photoInput = useRef<HTMLInputElement>(null)
  const videoInput = useRef<HTMLInputElement>(null)

  function addPhotos(files: FileList | null) {
    if (!files) return
    const picked = [...files].filter((f) => IMAGE_TYPES.includes(f.type) && f.size <= MAX_IMAGE_BYTES)
    if (picked.length < files.length) {
      setError("Photos need to be JPEG, PNG, WebP or AVIF, and under 5 MB each.")
    }
    setPhotos((prev) => [...prev, ...picked].slice(0, MAX_IMAGES))
  }

  function addVideo(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    if (!VIDEO_TYPES.includes(file.type)) return setError("Videos need to be MP4, WebM or MOV.")
    if (file.size > MAX_VIDEO_BYTES) return setError("That video is over 50 MB.")
    setError(null)
    setVideo(file)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNumber, email, slug, name, rating, quote }),
      })
      const payload = (await res.json()) as { token?: string; error?: string }
      if (!res.ok || !payload.token) {
        throw new Error(payload.error ?? "We couldn't save that review.")
      }

      // The review is safely written by here. A file that fails after this is
      // worth saying out loud, but it is not worth throwing the review away.
      const failures: string[] = []
      for (const photo of photos) {
        try {
          await uploadReviewFile(payload.token, photo, "image")
        } catch {
          failures.push(photo.name)
        }
      }
      if (video) {
        try {
          await uploadReviewFile(payload.token, video, "video")
        } catch {
          failures.push(video.name)
        }
      }

      setDone(true)
      if (failures.length > 0) {
        setError(`Your review was sent, but we couldn't upload ${failures.join(", ")}.`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-[var(--border)] bg-white p-8 text-center shadow-[var(--shadow-1)]">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50">
          <Check className="h-6 w-6 text-emerald-600" />
        </div>
        <h3 className="font-display mt-4 text-xl" style={{ fontWeight: 700 }}>
          Thank you — that&rsquo;s with us
        </h3>
        <p className="mt-2 text-[var(--muted)]">
          We read every review before it goes up, so it won&rsquo;t appear straight away.
        </p>
        {error && <p className="mt-3 text-sm text-[var(--primary)]">{error}</p>}
      </div>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-[var(--border)] bg-white p-7 shadow-[var(--shadow-1)]"
    >
      <h3 className="font-display text-xl" style={{ fontWeight: 700 }}>
        Bought the {buildName}? Tell us how it went
      </h3>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Reviews come from real orders, so we need the order number from your confirmation and the
        email you gave with it. Nothing goes up until we&rsquo;ve read it.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Labelled label="Order number">
          <input
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="BRK-1042"
            className={inputClass}
          />
        </Labelled>
        <Labelled label="Email on the order">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </Labelled>
        <Labelled label="Name to show">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Omer K."
            className={inputClass}
          />
        </Labelled>
        <Labelled label="Rating">
          <div className="flex items-center gap-1 py-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                aria-pressed={rating === n}
                onClick={() => setRating(n)}
                className="mat-btn rounded p-1"
              >
                <Star
                  className={`h-6 w-6 ${
                    n <= rating
                      ? "fill-[var(--primary)] text-[var(--primary)]"
                      : "fill-[var(--border)] text-[var(--border)]"
                  }`}
                />
              </button>
            ))}
          </div>
        </Labelled>
      </div>

      <div className="mt-4">
        <Labelled label="Your review">
          <textarea
            required
            minLength={15}
            maxLength={2000}
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="How it arrived, how it built, where it lives now…"
            className={`${inputClass} min-h-32 resize-y`}
          />
        </Labelled>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => photoInput.current?.click()}
          disabled={photos.length >= MAX_IMAGES}
          className="mat-btn inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          <ImagePlus className="h-4 w-4" />
          Add photos
        </button>
        <button
          type="button"
          onClick={() => videoInput.current?.click()}
          disabled={!!video}
          className="mat-btn inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          <Video className="h-4 w-4" />
          Add a video
        </button>
        <span className="text-xs text-[var(--muted)]">
          Up to {MAX_IMAGES} photos (5 MB each) and one video (50 MB).
        </span>
        <input
          ref={photoInput}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          multiple
          hidden
          onChange={(e) => {
            addPhotos(e.target.files)
            e.target.value = ""
          }}
        />
        <input
          ref={videoInput}
          type="file"
          accept={VIDEO_TYPES.join(",")}
          hidden
          onChange={(e) => {
            addVideo(e.target.files)
            e.target.value = ""
          }}
        />
      </div>

      {(photos.length > 0 || video) && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {photos.map((f, i) => (
            <Chip key={`${f.name}-${i}`} label={f.name} onRemove={() => setPhotos(photos.filter((_, n) => n !== i))} />
          ))}
          {video && <Chip label={video.name} onRemove={() => setVideo(null)} />}
        </ul>
      )}

      {error && <p className="mt-4 text-sm font-medium text-[var(--primary)]">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="mat-btn mt-6 rounded-full bg-[var(--primary)] px-7 py-3 text-sm font-semibold text-white shadow-[var(--shadow-2)] hover:bg-[var(--primary-deep)] disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send review"}
      </button>
    </form>
  )
}

const inputClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold tracking-wider text-[var(--muted)] uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <li className="inline-flex max-w-full items-center gap-2 rounded-full bg-[var(--surface-2)] py-1 pr-1 pl-3 text-xs">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="mat-btn grid h-5 w-5 place-items-center rounded-full hover:bg-[var(--border)]"
      >
        <X className="h-3 w-3" />
      </button>
    </li>
  )
}
