import type { Metadata } from "next"
import CheckoutView from "../../components/CheckoutView"
import { canCheckout } from "../../data"
import { getDeliveryOptions, getDisplays, getPaymentDetails, getProducts, getSettings } from "../../lib/shop"

export const metadata: Metadata = {
  title: "Checkout — brikc.it",
  description: "Confirm your order and get the transfer details.",
  robots: { index: false, follow: false },
}

// Never cached. Prices and payment details have to be the live ones — a
// checkout served from a stale copy could quote an old total, or worse, an old
// bank account.
export const dynamic = "force-dynamic"

export default async function CheckoutPage() {
  // A cart line can be either kind, so the catalogue the checkout re-prices
  // against — CheckoutView's `products` — has to carry both.
  const [models, displays, payment, settings, delivery] = await Promise.all([
    getProducts(),
    getDisplays(),
    getPaymentDetails(),
    getSettings(),
    getDeliveryOptions(),
  ])

  return (
    <CheckoutView
      products={[...models, ...displays]}
      ordersOpen={canCheckout(payment)}
      instagram={settings.instagram}
      delivery={delivery}
    />
  )
}
