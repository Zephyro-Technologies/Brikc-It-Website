import { Download, FileText } from "lucide-react"
import { productImage, subline } from "../lib/product-view"
import { downloadUrl, fileSize } from "../lib/download"
import type { Product } from "../data"

/**
 * One build and its manual.
 *
 * The whole card is the download when there is one — a small link inside a
 * large card is a small target on a phone. When there isn't, the card is not a
 * link at all rather than a link that goes nowhere.
 */
export function ManualCard({ product }: { product: Product }) {
  const has = product.manual.url !== ""

  const inner = (
    <>
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={productImage(product)}
          alt=""
          loading="lazy"
          className={`h-16 w-16 shrink-0 rounded-xl object-cover ${has ? "" : "opacity-40 grayscale"}`}
        />
        <div className="min-w-0">
          <h3 className="font-display truncate text-base" style={{ fontWeight: 700 }}>
            {product.name}
          </h3>
          <p className="mt-0.5 truncate text-sm text-[var(--muted)]">{subline(product)}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
        {has ? (
          <>
            <span className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--primary)]">
              <Download className="h-4 w-4 shrink-0" />
              Download PDF
            </span>
            <span className="shrink-0 font-mono text-xs text-[var(--muted)]">
              {fileSize(product.manual.bytes)}
            </span>
          </>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
            <FileText className="h-4 w-4 shrink-0" />
            Guide coming soon
          </span>
        )}
      </div>
    </>
  )

  const shell =
    "block h-full rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-1)]"

  if (!has) return <div className={`${shell} opacity-70`}>{inner}</div>

  return (
    <a
      href={downloadUrl(product.manual)}
      // Cross-origin, so this attribute alone would not save the file — the
      // ?download on the URL is what does it. Kept because it costs nothing
      // and states the intent.
      download={product.manual.name}
      className={`${shell} mat-btn transition-shadow hover:shadow-[var(--shadow-2)]`}
    >
      {inner}
    </a>
  )
}
