/**
 * Structured data for search engines, printed as a JSON-LD script tag.
 *
 * A plain <script>, not next/script: this is data, not code to run. Product
 * names and descriptions come from the admin, so "<" is written as < —
 * JSON still reads it as "<", but nothing in it can close the tag early with
 * "</script>" and start writing HTML.
 *
 * A null in the list is a block that had nothing true to say (a Product with no
 * offer and no rating) and is dropped; with nothing left, nothing is printed.
 */
export function JsonLd({ data }: { data: object | (object | null)[] }) {
  const blocks = Array.isArray(data) ? data.filter((d) => d !== null) : data
  if (Array.isArray(blocks) && blocks.length === 0) return null
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(blocks).replace(/</g, "\\u003c") }}
    />
  )
}
