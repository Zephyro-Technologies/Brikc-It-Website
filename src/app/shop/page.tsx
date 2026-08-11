import { Suspense } from "react"
import type { Metadata } from "next"
import ShopView from "../../components/ShopView"
import { getProducts } from "../../lib/shop"

export const metadata: Metadata = {
  title: "Shop all builds — brikc.it",
  description: "Every model available boxed, built, or framed with LED.",
}

// Awaiting searchParams opts this route into dynamic rendering, which lets the
// `useSearchParams()` call inside ShopView resolve on the server too — so the
// grid ships as real HTML instead of bailing out to client-side rendering.
export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const [products] = await Promise.all([getProducts(), searchParams])

  return (
    <Suspense fallback={null}>
      <ShopView products={products} />
    </Suspense>
  )
}
