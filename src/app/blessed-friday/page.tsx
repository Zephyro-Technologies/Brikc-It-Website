import BlackFridayView from "../../components/BlackFridayView"
import { getProducts } from "../../lib/shop"
import { pageMetadata } from "../../lib/seo"
import { BF_END_MS, bfState } from "../../lib/black-friday"

// Computed per request (the page is force-dynamic), so once the sale is over
// the page asks to be dropped from the index — no redeploy.
export async function generateMetadata() {
  const base = pageMetadata({
    title: "Blessed Friday",
    description:
      "Build your own Speed Champions bundle — any 2, 3 or 5 cars — and take straight discounts on the big Red Bull, McLaren and Shelby models. Until 30 November, Pakistan time, while stock lasts.",
    path: "/blessed-friday",
  })
  return Date.now() > BF_END_MS ? { ...base, robots: { index: false, follow: false } } : base
}

// Never cached. The page quotes live stock on items that run only a few
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
  // The state the server renders with, so the HTML is honest on both sides of
  // the window; the browser re-checks from its own clock after mount.
  return <BlackFridayView products={products} initialState={bfState()} />
}
