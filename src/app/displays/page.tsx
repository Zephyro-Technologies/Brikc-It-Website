import type { Metadata } from "next"
import Link from "next/link"
import { Reveal, SectionHead } from "../../components/ui"
import { money } from "../../cart"
import { DISPLAY_FINISHES, DISPLAY_PROMISES } from "../../content/displays"

export const metadata: Metadata = {
  title: "Displays — brikc.it",
  description:
    "Choose the finish that fits your wall. Every brikc.it model ships mount-ready, with a paper template and rated fixings included.",
}

export default function DisplaysPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Reveal>
        <SectionHead
          title="Displays"
          desc="Choose the finish that fits your wall. Every brikc.it model ships mount-ready, with a paper template and rated fixings included."
        />
      </Reveal>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {DISPLAY_FINISHES.map((f, i) => (
          <Reveal key={f.name} delay={i * 80}>
            <article className="mat-btn h-full rounded-3xl bg-white p-6 shadow-[var(--shadow-1)] hover:-translate-y-1 hover:shadow-[var(--shadow-2)]">
              <span className="block h-28 w-full rounded-2xl shadow-inner" style={{ background: f.swatch }} />
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

      <Reveal delay={DISPLAY_FINISHES.length * 80}>
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
