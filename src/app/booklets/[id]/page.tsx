import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getGuide, getGuides } from "../../../lib/shop"

/** A floor under the cache; see the note in src/app/page.tsx. */
export const revalidate = 60

export async function generateStaticParams() {
  const guides = await getGuides()
  return guides.map((g) => ({ id: g.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const guide = await getGuide(id)
  if (!guide) return { title: "Guide not found — brikc.it" }
  return {
    title: `${guide.title} — brikc.it`,
    description: guide.desc,
  }
}

export default async function BookletPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const guide = await getGuide(id)
  if (!guide) notFound()

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav className="mb-6 flex items-center gap-2 text-sm text-[var(--muted)]">
        <Link href="/booklets" className="hover:text-[var(--foreground)]">
          Booklets
        </Link>
        <span>/</span>
        <span className="text-[var(--foreground)]">{guide.title}</span>
      </nav>

      <header className="flex items-start gap-5">
        {guide.icon && (
          <span className="grid h-16 w-16 flex-none place-items-center rounded-3xl bg-[var(--surface-2)] text-3xl">
            {guide.icon}
          </span>
        )}
        <div>
          <span className="text-xs font-bold tracking-[0.2em] text-[var(--primary)] uppercase">Booklet guide</span>
          <h1 className="font-display mt-1 text-4xl tracking-tight sm:text-5xl" style={{ fontWeight: 800 }}>
            {guide.title}
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            {guide.pages}-page booklet · {guide.chapters.length} chapters
          </p>
        </div>
      </header>

      <p className="mt-6 text-lg leading-relaxed text-[var(--muted)]">{guide.desc}</p>

      <ol className="mt-10 space-y-6">
        {guide.chapters.map((c, i) => (
          <li key={c.title} className="flex gap-5 rounded-3xl bg-white p-6 shadow-[var(--shadow-1)]">
            <span
              className="font-display grid h-11 w-11 flex-none place-items-center rounded-2xl bg-[var(--primary)] text-white"
              style={{ fontWeight: 700 }}
            >
              {i + 1}
            </span>
            <div>
              <h2 className="font-display text-xl" style={{ fontWeight: 700 }}>
                {c.title}
              </h2>
              <p className="mt-2 leading-relaxed text-[var(--muted)]">{c.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex items-center justify-between border-t border-[var(--border)] pt-6">
        <Link
          href="/booklets"
          className="mat-btn inline-flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] hover:text-[var(--primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          All guides
        </Link>
        <Link href="/shop" className="text-sm font-semibold text-[var(--primary)] hover:underline">
          Shop models →
        </Link>
      </div>
    </article>
  )
}
