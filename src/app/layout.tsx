import { Suspense, type ReactNode } from "react"
import type { Metadata } from "next"
import { CartProvider } from "../cart"
import { Nav, Footer, CartDrawer } from "../components/Layout"
import { ScrollToTop } from "../components/ScrollToTop"
import MetaPixel from "../components/MetaPixel"
import { getDisplays, getSettings } from "../lib/shop"
import { ShopSettingsProvider } from "../lib/shop-settings"
import { BRAND, SITE_DESCRIPTION, SITE_URL, TITLE_TEMPLATE } from "../lib/seo"
import "./globals.css"

// The defaults every page starts from. Each indexable page sets its own title,
// description, canonical and preview through pageMetadata() in src/lib/seo.ts;
// what is here is the base URL those resolve against, the " | BrikcIt" suffix,
// and a preview for anything that sets none. No canonical here: a page that
// forgot its own would inherit "/" and tell Google it is the homepage.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND} — LEGO sets in Pakistan, built or boxed`, template: TITLE_TEMPLATE },
  description: SITE_DESCRIPTION,
  applicationName: BRAND,
  icons: { icon: "/brand/icon.png", apple: "/brand/icon.png" },
  openGraph: {
    type: "website",
    siteName: BRAND,
    locale: "en_PK",
    images: [{ url: "/brand/hero.jpg", width: 1920, height: 1071, alt: "Builds on lit display shelves" }],
  },
  twitter: { card: "summary_large_image", images: ["/brand/hero.jpg"] },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // The announcement bar's text, the footer's Instagram handle, the threshold
  // the cards use to decide when to say "Only 2 left", and the Meta Pixel's id.
  // Prices live on the product, so the cart still depends on no store setting.
  // Whether there are displays decides whether the nav offers them at all.
  const [settings, displays] = await Promise.all([getSettings(), getDisplays()])
  const hasDisplays = displays.length > 0

  return (
    <html lang="en-PK">
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
