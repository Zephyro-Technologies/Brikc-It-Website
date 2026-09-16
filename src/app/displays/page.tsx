import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Reveal, SectionHead } from "../../components/ui"
import { DisplayCard } from "../../components/DisplayCard"
import { DISPLAY_PROMISES } from "../../content/displays"
import { getDisplays } from "../../lib/shop"

export const metadata: Metadata = {
  title: "Displays — brikc.it",
  description:
    "Choose the finish that fits your wall. Every brikc.it model ships mount-ready, with a paper template and rated fixings included.",
}

export default async function DisplaysPage() {
  const displays = await getDisplays()

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Reveal>
        <SectionHead
          title="Displays"
          desc="Choose the finish that fits your wall. Every brikc.it model ships mount-ready, with a paper template and rated fixings included."
        />
      </Reveal>

      {displays.length === 0 ? (
        <Reveal>
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-2)] p-10 text-center">
            <h2 className="font-display text-2xl" style={{ fontWeight: 700 }}>
              No displays to show yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[var(--muted)]">
              Check back soon, or pair a model straight from the shop while the lineup fills in.
            </p>
            <Link
              href="/shop"
              className="mat-btn mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-7 py-3.5 text-sm font-semibold text-white hover:brightness-105"
            >
              Browse the shop
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {displays.map((d, i) => (
            <Reveal key={d.slug} delay={i * 80}>
              <DisplayCard product={d} />
            </Reveal>
          ))}
        </div>
      )}

      <Reveal delay={displays.length * 80}>
        <div className="mt-12 grid gap-6 rounded-3xl bg-[var(--surface-2)] p-8 sm:grid-cols-3">
          {DISPLAY_PROMISES.map((x) => (
            <div key={x.title}>
              <h4 className="font-display text-lg" style={{ fontWeight: 700 }}>
                {x.title}
              </h4>
              <p className="mt-2 text-sm text-[var(--muted)]">{x.body}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
