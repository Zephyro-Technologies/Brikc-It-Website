import { Suspense, type ReactNode } from "react"
import type { Metadata } from "next"
import { CartProvider } from "../cart"
import { Nav, Footer, CartDrawer } from "../components/Layout"
import { ScrollToTop } from "../components/ScrollToTop"
import { getSettings } from "../lib/shop"
import "./globals.css"

export const metadata: Metadata = {
  title: "brikc.it — LEGO-style models & LED display frames",
  description:
    "Cars, bikes, F1 and collector sets — built, boxed, or mounted in LED-lit display frames. Made to sit on your wall, not in a drawer.",
  icons: { icon: "/brand/icon.png", apple: "/brand/icon.png" },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Format pricing is a store setting now, and the cart needs it to price a
  // line the moment something is added — so it is fetched once, up here.
  const settings = await getSettings()

  return (
    <html lang="en">
      <body>
        <CartProvider settings={settings}>
          <Suspense fallback={null}>
            <ScrollToTop />
          </Suspense>
          <div className="min-h-screen bg-[#09090a] text-zinc-100">
            <Nav />
            <CartDrawer />
            <main>{children}</main>
            <Footer instagram={settings.instagram} />
          </div>
        </CartProvider>
      </body>
    </html>
  )
}
