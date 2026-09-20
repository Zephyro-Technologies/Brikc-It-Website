import type { Metadata } from "next"
import ProductDetailView from "../../../components/ProductDetailView"
import { getCategories, getProduct, getProductSlugs, getProducts } from "../../../lib/shop"

/** A floor under the cache; see the note in src/app/page.tsx. */
export const revalidate = 60

export async function generateStaticParams() {
  return (await getProductSlugs()).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: "Build not found — brikc.it" }
  return {
    title: `${product.name} — brikc.it`,
    description: product.blurb,
    openGraph: { images: product.images[0] ? [product.images[0]] : [] },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [product, all, categories] = await Promise.all([
    getProduct(slug),
    getProducts(),
    getCategories(),
  ])

  if (!product) return <ProductDetailView product={undefined} suggestions={[]} />

  // Every other build, not a pre-picked four: the page shuffles this in the
  // browser and takes four from it, so two visitors see different ones. Picking
  // here instead would bake one arrangement into the prerendered HTML.
  const pool = all.filter((p) => p.slug !== slug)

  // The breadcrumb links by slug, so it survives the category being renamed.
  const categorySlug = categories.find((c) => c.name === product.category)?.slug ?? ""

  return (
    // Keyed on the build so React remounts it when you navigate from one
    // product to another. Resetting the gallery position, the frame tick and the
    // chosen tab in an effect instead would run a frame LATE — long enough to
    // show the previous build's fourth photograph on the new one's page.
    <ProductDetailView
      key={slug}
      product={product}
      suggestions={pool}
      categorySlug={categorySlug}
    />
  )
}
