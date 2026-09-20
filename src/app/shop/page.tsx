import { Suspense } from "react"
import type { Metadata } from "next"
import ShopView from "../../components/ShopView"
import { getCategories, getProducts } from "../../lib/shop"

export const metadata: Metadata = {
  title: "Shop all builds — brikc.it",
  description: "Every model, unassembled or assembled, with an optional display frame — lit or plain.",
}

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
