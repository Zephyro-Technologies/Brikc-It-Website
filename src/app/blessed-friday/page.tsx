import BlackFridayView from "../../components/BlackFridayView"
import { getProducts } from "../../lib/shop"
import { pageMetadata } from "../../lib/seo"

export const metadata = pageMetadata({
  title: "Blessed Friday",
  description:
    "24–30 November: build your own Speed Champions bundle — any 2, 3 or 5 cars — and take the big 1:8 models at their lowest prices of the year. Stock is 1–3 units per item.",
  path: "/blessed-friday",
})

// Never cached. The page quotes live stock on items that are one to three
// deep, so a prerendered copy could sell a shelf that emptied an hour ago —
// and being dynamic keeps it off the revalidation queue entirely, which the
// free Durable Objects plan will thank us for. The sale window itself is
// decided client-side (the copy) and server-side in /api/bf/order (the money),
// so this page needs no rebuild at the stroke of midnight either.
export const dynamic = "force-dynamic"

export default async function BlackFridayPage() {
  // Models only: every sale item is a model sold unassembled. getProducts()
  // also returns catalogue bundles, which is fine — the view picks what the
  // config names and ignores the rest.
  const products = await getProducts()
  return <BlackFridayView products={products} />
}
