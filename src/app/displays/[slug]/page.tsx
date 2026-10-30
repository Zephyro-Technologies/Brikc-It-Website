import type { Metadata } from "next"
import { notFound } from "next/navigation"
import DisplayDetailView from "../../../components/DisplayDetailView"
import { getDisplay, getDisplays } from "../../../lib/shop"
import { largeImage } from "../../../lib/media"

/** A floor under the cache; see the note in src/app/page.tsx. */
export const revalidate = 3600

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
    // The 1280 copy: a link preview is never drawn wider, and a chat app is
    // likelier to fetch a small file than the 2800px original.
    openGraph: { images: display.images[0] ? [largeImage(display.images[0])] : [] },
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
