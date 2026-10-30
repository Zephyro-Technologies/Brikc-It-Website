import type { Metadata } from "next"
import { notFound } from "next/navigation"
import ProductDetailView from "../../../components/ProductDetailView"
import { JsonLd } from "../../../components/JsonLd"
import {
  getCategories,
  getProduct,
  getProductReviews,
  getProductSlugs,
  getProducts,
} from "../../../lib/shop"
import {
  bundleDescription,
  displayDescription,
  modelDescription,
  modelTitle,
  pageMetadata,
  previewImage,
} from "../../../lib/seo"
import { breadcrumbJsonLd, productJsonLd } from "../../../lib/structured-data"

/** A floor under the cache; see the note in src/app/page.tsx. */
export const revalidate = 3600

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
  if (!product) return { title: "Build not found" }

  // A model is a LEGO set and its title says so — in metadata only, never on
  // the page, and not when its own description says it isn't; see
  // isLegoSet() in src/lib/seo.ts. A bundle can hold a display beside a set, and
  // a display is the shop's own, so neither is called LEGO. A display can be
  // reached here by its slug too, but its page is /displays/<slug>, and that is
  // the address this one points Google at.
  if (product.kind === "display") {
    return pageMetadata({
      title: product.name,
      description: displayDescription(product),
      path: `/displays/${slug}`,
      image: previewImage(product),
      imageAlt: product.name,
    })
  }
  return pageMetadata({
    title: product.kind === "model" ? modelTitle(product) : product.name,
    description: product.kind === "model" ? modelDescription(product) : bundleDescription(product),
    path: `/shop/${slug}`,
    // The 1280 copy: a link preview is never drawn wider, and a chat app is
    // likelier to fetch a small file than the 2800px original.
    image: previewImage(product),
    imageAlt: product.name,
  })
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [product, all, categories, reviews] = await Promise.all([
    getProduct(slug),
    getProducts(),
    getCategories(),
    getProductReviews(slug),
  ])

  // A 404, not a page saying so: answered with a 200, every address a
  // scanner or a typo made up was cached as a page of its own and rebuilt on
  // the timer like a real one, without limit.
  if (!product) notFound()

  // Every other build, not a pre-picked four: the page shuffles this in the
  // browser and takes four from it, so two visitors see different ones. Picking
  // here instead would bake one arrangement into the prerendered HTML.
  const pool = all.filter((p) => p.slug !== slug)

  // The breadcrumb links by slug, so it survives the category being renamed.
  const categorySlug = categories.find((c) => c.name === product.category)?.slug ?? ""

  const path = product.kind === "display" ? `/displays/${slug}` : `/shop/${slug}`
  const trail =
    product.kind === "display"
      ? [{ name: "Home", path: "/" }, { name: "Displays", path: "/displays" }]
      : [{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }]

  return (
    <>
      {/* The rating is the published reviews this page lists, nothing wider. */}
      <JsonLd
        data={[productJsonLd(product, path, reviews), breadcrumbJsonLd([...trail, { name: product.name, path }])]}
      />
      {/* Keyed on the build so React remounts it when you navigate from one
          product to another. Resetting the gallery position, the frame tick and
          the chosen tab in an effect instead would run a frame LATE — long
          enough to show the previous build's fourth photograph on the new
          one's page. */}
      <ProductDetailView
        key={slug}
        product={product}
        suggestions={pool}
        reviews={reviews}
        categorySlug={categorySlug}
      />
    </>
  )
}
