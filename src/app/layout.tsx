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
  // Only the footer's Instagram handle needs this now — prices live on the
  // product, so the cart no longer depends on any store setting.
  const settings = await getSettings()

  return (
    <html lang="en">
      <body>
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
      </body>
    </html>
  )
}
