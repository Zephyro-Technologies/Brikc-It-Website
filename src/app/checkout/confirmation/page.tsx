import type { Metadata } from "next"
import OrderConfirmation from "../../../components/OrderConfirmation"
import { getPaymentDetails } from "../../../lib/shop"

export const metadata: Metadata = {
  title: "Order placed — brikc.it",
  description: "Transfer details for the order you've just placed.",
  robots: { index: false, follow: false },
}

// Same reasoning as the checkout: bank details are read fresh every time, so a
// changed account can never be served from a cache.
export const dynamic = "force-dynamic"

export default async function ConfirmationPage() {
  const payment = await getPaymentDetails()
  return <OrderConfirmation payment={payment} />
}
