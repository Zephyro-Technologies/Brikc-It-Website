import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ComingSoon, SectionHead, Reveal } from "../../components/ui"
import { Faq } from "../../components/Faq"
import { getFaqs, getGuides, getSettings } from "../../lib/shop"
import type { Guide } from "../../data"

/** A floor under the cache; see the note in src/app/page.tsx. */
export const revalidate = 60

export const metadata: Metadata = {
  title: "Booklet Guides — brikc.it",
  description: "Step-by-step build, framing, lighting and care guides — free with every model.",
}

export default async function BookletsPage() {
  const [faqs, guides, settings] = await Promise.all([getFaqs(), getGuides(), getSettings()])
  const instagramHandle = settings.instagram.replace(/^@/, "")

  return (
    <>
      <GuideGrid guides={guides} />

      <Faq items={faqs} />

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-[var(--foreground)] p-7 text-white sm:flex-row sm:items-center">
            <div>
              <h3 className="font-display text-xl" style={{ fontWeight: 700 }}>
                Still need a hand?
              </h3>
              <p className="mt-1 text-white/70">DM us on Instagram @{instagramHandle} and we'll sort it out.</p>
            </div>
            <a
              href={`https://instagram.com/${instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mat-btn flex-none rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--foreground)] hover:bg-white/90"
            >
              Message us on Instagram
            </a>
          </div>
        </Reveal>
      </section>
    </>
  )
}

function GuideGrid({ guides }: { guides: Guide[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Reveal>
        <SectionHead
          title="Booklet Guides"
          desc="Step-by-step build, framing, lighting and care guides — free with every model, and readable here any time."
        />
      </Reveal>
      {guides.length === 0 ? (
        <ComingSoon note="Build, framing and lighting guides are being written." />
      ) : (
      <div className="grid gap-5 sm:grid-cols-2">
        {guides.map((g, i) => (
          <Reveal key={g.slug} delay={i * 80}>
            <Link
              href={`/booklets/${g.slug}`}
              className="mat-btn group flex h-full flex-col rounded-3xl bg-white p-6 shadow-[var(--shadow-1)] hover:-translate-y-1 hover:shadow-[var(--shadow-2)]"
            >
              <div className="flex items-center gap-4">
                {g.icon && (
                  <span className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-[var(--surface-2)] text-2xl">
                    {g.icon}
                  </span>
                )}
                <div>
                  <h3 className="font-display text-xl" style={{ fontWeight: 700 }}>
                    {g.title}
                  </h3>
                  <span className="text-sm text-[var(--muted)]">
                    {g.pages}-page booklet · {g.chapters.length} chapters
                  </span>
                </div>
              </div>
              <p className="mt-4 flex-1 text-[var(--muted)]">{g.desc}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                Read guide
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
      )}
    </section>
  )
}
