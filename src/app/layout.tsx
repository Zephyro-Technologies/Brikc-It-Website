import { Suspense, type ReactNode } from "react"
import type { Metadata } from "next"
import { CartProvider } from "../cart"
import { Nav, Footer, CartDrawer } from "../components/Layout"
import { ScrollToTop } from "../components/ScrollToTop"
import { getSettings } from "../lib/shop"
import { ShopSettingsProvider } from "../lib/shop-settings"
import "./globals.css"

export const metadata: Metadata = {
  title: "brikc.it — LEGO-style models & LED display frames",
  description:
    "Cars, bikes, F1 and collector sets — built, boxed, or mounted in LED-lit display frames. Made to sit on your wall, not in a drawer.",
  icons: { icon: "/brand/icon.png", apple: "/brand/icon.png" },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // The footer's Instagram handle, and the threshold the cards use to decide
  // when to say "Only 2 left". Prices live on the product, so the cart still
  // depends on no store setting.
  const settings = await getSettings()

  return (
    <html lang="en">
      <body>
        <ShopSettingsProvider value={{ lowStockAt: settings.lowStockAt }}>
          <CartProvider>
            <Suspense fallback={null}>
              <ScrollToTop />
            </Suspense>
            <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
              <Nav />
              <CartDrawer />
              <main>{children}</main>
              <Footer instagram={settings.instagram} />
            </div>
          </CartProvider>
        </ShopSettingsProvider>
      </body>
    </html>
  )
}
