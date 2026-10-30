import type { Metadata } from "next"
import { notFound } from "next/navigation"
import DisplayDetailView from "../../../components/DisplayDetailView"
import { getDisplay, getDisplays } from "../../../lib/shop"
import { JsonLd } from "../../../components/JsonLd"
import { displayDescription, pageMetadata, previewImage } from "../../../lib/seo"
import { breadcrumbJsonLd, productJsonLd } from "../../../lib/structured-data"

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
  if (!display) return { title: "Display not found" }
  // The shop's own product, so never called LEGO — not even here.
  return pageMetadata({
    title: display.name,
    description: displayDescription(display),
    path: `/displays/${slug}`,
    // The 1280 copy: a link preview is never drawn wider, and a chat app is
    // likelier to fetch a small file than the 2800px original.
    image: previewImage(display),
    imageAlt: display.name,
  })
}

export default async function DisplayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [display, all] = await Promise.all([getDisplay(slug), getDisplays()])

  if (!display) notFound()

  // Every display shares the one category, so there's no "same category
  // first" split to make — just the rest of the lineup, current one left out.
  const suggestions = all.filter((d) => d.slug !== slug).slice(0, 4)

  const path = `/displays/${slug}`
  return (
    <>
      <JsonLd
        data={[
          productJsonLd(display, path),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Displays", path: "/displays" },
            { name: display.name, path },
          ]),
        ]}
      />
      <DisplayDetailView product={display} suggestions={suggestions} />
    </>
  )
}
