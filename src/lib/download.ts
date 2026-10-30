import { MEDIA_ORIGIN } from "./media"

/**
 * Turning a stored manual into something a browser will actually save.
 *
 * Two problems, both invisible until somebody taps the link on a phone.
 *
 * The `download` attribute is ignored cross-origin, and the file lives on
 * another origin from the shop. Left to itself the browser opens the PDF in a
 * tab instead of saving it — and names it 8f3c1a92-….pdf if it does save it.
 *
 * A manual on the media origin (R2) already answers with a Content-Disposition
 * of attachment and its proper name: the admin sets that header on the object
 * when it uploads, so the URL is used as it stands. R2 has no equivalent of a
 * query parameter that changes the header, so adding one would do nothing.
 *
 * A manual still on Supabase storage gets `?download=<name>`, which Supabase
 * answers with that same header, naming the file at the same time.
 */
export function downloadUrl(manual: { url: string; name: string }): string {
  if (!manual.url) return ""
  if (manual.url.startsWith(`${MEDIA_ORIGIN}/`)) return manual.url
  const name = manual.name.trim() || "assembly-manual.pdf"
  const separator = manual.url.includes("?") ? "&" : "?"
  return `${manual.url}${separator}download=${encodeURIComponent(name)}`
}

/** "2.4 MB" — what somebody on mobile data wants to know before they tap it. */
export function fileSize(bytes: number): string {
  if (bytes <= 0) return ""
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}
