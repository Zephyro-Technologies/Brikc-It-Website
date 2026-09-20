import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ComingSoon, Reveal, SectionHead } from "../../components/ui"
import { DisplayCard } from "../../components/DisplayCard"
import { DISPLAY_PROMISES } from "../../content/displays"
import { getDisplays } from "../../lib/shop"

/** A floor under the cache; see the note in src/app/page.tsx. */
export const revalidate = 60

export const metadata: Metadata = {
  title: "Displays — brikc.it",
  description:
    "Frames, desks and the rest of the range — the pieces a build lives on once it is finished.",
}

export default async function DisplaysPage() {
  const displays = await getDisplays()

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Reveal>
        <SectionHead
          title="Displays"
          desc="Frames, desks and the rest of the range — the pieces a build lives on once it is finished."
        />
      </Reveal>

      {displays.length === 0 ? (
        <Reveal>
          <ComingSoon note="The display range is being photographed and priced." />
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
