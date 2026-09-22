/**
 * Turning a stored manual into something a browser will actually save.
 *
 * Two problems, both invisible until somebody taps the link on a phone.
 *
 * The `download` attribute is ignored cross-origin, and the file lives on
 * Supabase storage, which is a different origin from the shop. Left to itself
 * the browser opens the PDF in a tab instead of saving it. Supabase answers
 * `?download=<name>` with a Content-Disposition of attachment, which is what
 * actually makes it a download — and it names the file at the same time, so
 * nobody ends up with 8f3c1a92-….pdf in their downloads folder.
 */
export function downloadUrl(manual: { url: string; name: string }): string {
  if (!manual.url) return ""
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
