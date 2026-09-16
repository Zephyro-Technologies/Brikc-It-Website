import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Reveal, SectionHead } from "../../components/ui"
import { money } from "../../lib/money"
import { DISPLAY_PROMISES } from "../../content/displays"
import { getDisplayFinishes } from "../../lib/shop"

export const metadata: Metadata = {
  title: "Displays — brikc.it",
  description:
    "Choose the finish that fits your wall. Every brikc.it model ships mount-ready, with a paper template and rated fixings included.",
}

export default async function DisplaysPage() {
  const finishes = await getDisplayFinishes()

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Reveal>
        <SectionHead
          title="Displays"
          desc="Choose the finish that fits your wall. Every brikc.it model ships mount-ready, with a paper template and rated fixings included."
        />
      </Reveal>

      {finishes.length === 0 ? (
        <Reveal>
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-2)] p-10 text-center">
            <h2 className="font-display text-2xl" style={{ fontWeight: 700 }}>
              No finishes to show yet
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
          {finishes.map((f, i) => (
            <Reveal key={f.name} delay={i * 80}>
              <article className="mat-btn h-full rounded-3xl bg-white p-6 shadow-[var(--shadow-1)] hover:-translate-y-1 hover:shadow-[var(--shadow-2)]">
                {f.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.image}
                    alt=""
                    loading="lazy"
                    className="block h-28 w-full rounded-2xl object-cover shadow-inner"
                  />
                ) : (
                  <span className="block h-28 w-full rounded-2xl shadow-inner" style={{ background: f.swatch }} />
                )}
                <h3 className="font-display mt-5 text-lg" style={{ fontWeight: 700 }}>
                  {f.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{f.finish}</p>
                <div className={`mt-4 flex items-center gap-2 ${f.from !== null ? "justify-between" : "justify-end"}`}>
                  {f.from !== null && (
                    <span className="text-sm text-[var(--muted)]">
                      from <span className="text-base font-bold text-[var(--foreground)]">{money(f.from)}</span>
                    </span>
                  )}
                  <Link href="/shop" className="text-sm font-semibold text-[var(--primary)] hover:underline">
                    Pair a model →
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      )}

      <Reveal delay={finishes.length * 80}>
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
