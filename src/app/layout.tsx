import { Suspense, type ReactNode } from "react"
import type { Metadata } from "next"
import { CartProvider } from "../cart"
import { Nav, Footer, CartDrawer } from "../components/Layout"
import { ScrollToTop } from "../components/ScrollToTop"
import MetaPixel from "../components/MetaPixel"
import { getDisplays, getSettings } from "../lib/shop"
import { ShopSettingsProvider } from "../lib/shop-settings"
import "./globals.css"

export const metadata: Metadata = {
  title: "brikc.it — Brick-built scale models & LED display frames",
  description:
    "Cars, bikes, F1 and collector sets — built, boxed, or mounted in LED-lit display frames. Made to sit on your wall, not in a drawer.",
  icons: { icon: "/brand/icon.png", apple: "/brand/icon.png" },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // The announcement bar's text, the footer's Instagram handle, the threshold
  // the cards use to decide when to say "Only 2 left", and the Meta Pixel's id.
  // Prices live on the product, so the cart still depends on no store setting.
  // Whether there are displays decides whether the nav offers them at all.
  const [settings, displays] = await Promise.all([getSettings(), getDisplays()])
  const hasDisplays = displays.length > 0

  return (
    <html lang="en">
      <body>
        <MetaPixel id={settings.metaPixelId} />
        <ShopSettingsProvider value={{ lowStockAt: settings.lowStockAt }}>
          <CartProvider>
            <Suspense fallback={null}>
              <ScrollToTop />
            </Suspense>
            <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
              <Nav banner={settings.banner} hasDisplays={hasDisplays} />
              <CartDrawer />
              <main>{children}</main>
              <Footer instagram={settings.instagram} hasDisplays={hasDisplays} />
            </div>
          </CartProvider>
        </ShopSettingsProvider>
      </body>
    </html>
  )
}
