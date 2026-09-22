import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Download, FileText } from "lucide-react"
import { ComingSoon, Reveal, SectionHead } from "../../components/ui"
import { getProducts } from "../../lib/shop"
import { productImage, subline } from "../../lib/product-view"
import { downloadUrl, fileSize } from "../../lib/download"
import type { Product } from "../../data"

/** A floor under the cache; see the note in src/app/page.tsx. */
export const revalidate = 60

export const metadata: Metadata = {
  title: "Assembly guides — brikc.it",
  description: "Download the step-by-step assembly manual for any build in the shop.",
}

export default async function GuidesPage() {
  // Models only. A display arrives built and a bundle is a way of buying
  // several builds rather than a thing you assemble — each of its members has
  // its own manual, listed here under its own name. getProducts() returns
  // models and bundles together because they share the shop grid, so the
  // filter belongs here.
  const products = (await getProducts()).filter((p) => p.kind === "model")

  // The ones you can actually download first. A build whose manual is still
  // being written is listed rather than hidden — it is in the shop, somebody
  // owns it, and "we haven't written it yet" is a better answer than a page
  // that silently doesn't mention it.
  const ready = products.filter((p) => p.manual.url !== "")
  const pending = products.filter((p) => p.manual.url === "")

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 pb-24 sm:px-6">
      <Reveal>
        <SectionHead
          title="Build it step by step"
          desc="Every manual we've written, free to download. Find your build and take the PDF with you — you don't need to be online to follow it."
        />
      </Reveal>

      {products.length === 0 ? (
        <ComingSoon note="The catalogue is being filled in — manuals will follow it." />
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ready.map((product, i) => (
              <li key={product.slug}>
                <Reveal delay={i * 40}>
                  <ManualCard product={product} />
                </Reveal>
              </li>
            ))}
            {pending.map((product, i) => (
              <li key={product.slug}>
                <Reveal delay={(ready.length + i) * 40}>
                  <ManualCard product={product} />
                </Reveal>
              </li>
            ))}
          </ul>

          {ready.length === 0 && (
            <p className="mt-8 text-[var(--muted)]">
              No manuals are up yet. They&rsquo;re being written build by build.
            </p>
          )}
        </>
      )}

      {/* The written booklets used to be what "Guides" meant in the nav, and the
          FAQ still lives on that page. Nothing else links there now, so this
          does — admin-editable content should not be stranded by a move. */}
      <Reveal>
        <div className="mt-14 flex flex-col items-start justify-between gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface-2)] p-7 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-display text-xl" style={{ fontWeight: 700 }}>
              Looking for the written booklets?
            </h3>
            <p className="mt-1 text-[var(--muted)]">
              Framing, lighting and care — plus the answers to the questions we get most.
            </p>
          </div>
          <Link
            href="/booklets"
            className="mat-btn flex-none inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-white"
          >
            Read the booklets
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Reveal>
    </div>
  )
}

/**
 * One build and its manual.
 *
 * The whole card is the download when there is one — a small link inside a
 * large card is a small target on a phone. When there isn't, the card is not a
 * link at all rather than a link that goes nowhere.
 */
function ManualCard({ product }: { product: Product }) {
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
