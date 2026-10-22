import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ComingSoon, Reveal, SectionHead } from "../../components/ui"
import GuidesBrowser from "../../components/GuidesBrowser"
import { getCategories, getProducts } from "../../lib/shop"

/** A floor under the cache; see the note in src/app/page.tsx. */
export const revalidate = 3600

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
  const [all, categories] = await Promise.all([getProducts(), getCategories()])
  const products = all.filter((p) => p.kind === "model")

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
        <GuidesBrowser products={[...ready, ...pending]} categories={categories} />
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
