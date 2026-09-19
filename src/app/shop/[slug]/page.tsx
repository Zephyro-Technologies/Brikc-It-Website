import type { Metadata } from "next"
import ProductDetailView from "../../../components/ProductDetailView"
import { getCategories, getProduct, getProductSlugs, getProducts } from "../../../lib/shop"

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

  // Same category first, then anything else, up to four.
  const related = all.filter((p) => p.slug !== slug && p.category === product.category).slice(0, 4)
  const fill = all
    .filter((p) => p.slug !== slug && !related.some((r) => r.slug === p.slug))
    .slice(0, Math.max(0, 4 - related.length))

  // The breadcrumb links by slug, so it survives the category being renamed.
  const categorySlug = categories.find((c) => c.name === product.category)?.slug ?? ""

  return (
    <ProductDetailView
      product={product}
      suggestions={[...related, ...fill]}
      categorySlug={categorySlug}
    />
  )
}
