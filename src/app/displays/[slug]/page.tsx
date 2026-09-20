import type { Metadata } from "next"
import { notFound } from "next/navigation"
import DisplayDetailView from "../../../components/DisplayDetailView"
import { getDisplay, getDisplays } from "../../../lib/shop"

/** A floor under the cache; see the note in src/app/page.tsx. */
export const revalidate = 60

export async function generateStaticParams() {
  return (await getDisplays()).map((d) => ({ slug: d.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const display = await getDisplay(slug)
  if (!display) return { title: "Display not found — brikc.it" }
  return {
    title: `${display.name} — brikc.it`,
    description: display.blurb,
    openGraph: { images: display.images[0] ? [display.images[0]] : [] },
  }
}

export default async function DisplayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [display, all] = await Promise.all([getDisplay(slug), getDisplays()])

  if (!display) notFound()

  // Every display shares the one category, so there's no "same category
  // first" split to make — just the rest of the lineup, current one left out.
  const suggestions = all.filter((d) => d.slug !== slug).slice(0, 4)

  return <DisplayDetailView product={display} suggestions={suggestions} />
}
