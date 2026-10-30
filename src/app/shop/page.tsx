import { Suspense } from "react"
import type { Metadata } from "next"
import ShopView from "../../components/ShopView"
import { getCategories, getProducts } from "../../lib/shop"
import { pageMetadata } from "../../lib/seo"

// Canonical is /shop for every ?cat= and ?price=. Those are the same grid
// filtered in the browser, with no words of their own — a category's blurb is
// not rendered — so as separate pages they would be near-duplicates splitting
// one page's standing between them. The links still work and are still
// crawled; they just point Google at the one page that holds everything.
export const metadata: Metadata = pageMetadata({
  title: "Shop LEGO sets in Pakistan",
  description:
    "Every LEGO set in the shop: cars, bikes, F1 and collector builds, unassembled in the box or assembled for you, with an optional display frame. Free delivery across Pakistan.",
  path: "/shop",
})

// Awaiting searchParams opts this route into dynamic rendering, which lets the
// `useSearchParams()` call inside ShopView resolve on the server too — so the
// grid ships as real HTML instead of bailing out to client-side rendering.
export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const [products, categories] = await Promise.all([getProducts(), getCategories(), searchParams])

  return (
    <Suspense fallback={null}>
      <ShopView products={products} categories={categories} />
    </Suspense>
  )
}
