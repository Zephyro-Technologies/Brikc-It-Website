"use client"

import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

/**
 * The one thing the browser talks to Supabase about: putting a reviewer's
 * photographs and video somewhere.
 *
 * Everywhere else, `src/lib/shop.ts` is the only thing that touches Supabase
 * and it runs on the server. Files are the exception, and deliberately: sending
 * a 50 MB video through the Worker to hand it on would cost the request twice
 * and put a body that size inside a runtime that does not want one. The browser
 * uploads it directly instead.
 *
 * Which is safe because of what the key can do, not because of what this file
 * does. The publishable key is `anon`, and `anon`'s only write anywhere in
 * storage is an INSERT policy that calls `private.review_upload_open()`: the
 * path's first folder has to be the upload token of a review that is still
 * pending and was submitted within the hour, and that folder has to hold fewer
 * than three images or fewer than one video. Without a token issued by
 * `submit_review` seconds earlier, this client cannot write a byte.
 */

export const REVIEW_IMAGE_BUCKET = "review-images"
export const REVIEW_VIDEO_BUCKET = "review-videos"

/** What the buckets themselves enforce. Repeated here only to fail fast and say why. */
export const MAX_IMAGES = 3
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"]
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]

function browserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error("Supabase is not configured.")
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function extensionFor(file: File): string {
  const fromName = file.name.includes(".") ? file.name.split(".").pop()! : ""
  // Never trust the name for anything but a hint — the bucket's mime list is
  // what actually decides whether this upload is allowed.
  return /^[a-z0-9]{1,5}$/i.test(fromName) ? fromName.toLowerCase() : "bin"
}

/**
 * Put one file under the review's token folder, then tell the database it
 * belongs to that review. Both halves check the token: the upload through the
 * storage policy, the attach through `attach_review_media`, which also refuses
 * a path that is not actually in the bucket.
 */
export async function uploadReviewFile(token: string, file: File, kind: "image" | "video") {
  const bucket = kind === "video" ? REVIEW_VIDEO_BUCKET : REVIEW_IMAGE_BUCKET
  const limit = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  const types = kind === "video" ? VIDEO_TYPES : IMAGE_TYPES

  if (!types.includes(file.type)) {
    throw new Error(
      kind === "video"
        ? "Videos need to be MP4, WebM or MOV."
        : "Photos need to be JPEG, PNG, WebP or AVIF.",
    )
  }
  if (file.size > limit) {
    throw new Error(
      kind === "video" ? "That video is over 50 MB." : "That photo is over 5 MB.",
    )
  }

  const db = browserClient()
  const path = `${token}/${crypto.randomUUID()}.${extensionFor(file)}`

  const { error: uploadError } = await db.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) throw new Error("We couldn't upload that file.")

  const { error: attachError } = await db.rpc("attach_review_media", {
    p_token: token,
    p_bucket: bucket,
    p_path: path,
  })
  if (attachError) throw new Error("We couldn't attach that file to your review.")
}
