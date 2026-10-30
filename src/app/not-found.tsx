import type { Metadata } from "next"
import Link from "next/link"
import { ExploreMore } from "../components/ui"

/**
 * Every unknown address, and every `notFound()` — a build that doesn't exist,
 * a booklet that was deleted — lands here, answered with a 404.
 *
 * Unknown addresses used to be caught by a `[...notfound]` route that drew the
 * homepage and answered 200, a habit from the prototype's router. To Google
 * that was an endless supply of copies of the homepage, /sitemap.xml among
 * them. A lost visitor still gets somewhere useful: this page offers the places
 * they were most likely looking for.
 *
 * It deliberately does NOT import Home. Next serialises the not-found boundary
 * into every route's payload, so rendering the homepage here shipped the entire
 * home page markup with /shop, every product page and every other route.
 *
 * It reads nothing. An unknown address is answered from a copy made at build
 * time that no revalidation reaches, so a link that depended on the catalogue
 * (Displays, once there are some) would stay as it was at the last deploy. The
 * shop and the best sellers are always there.
 */

// No robots tag here: Next adds "noindex" itself to anything answered with a 404.
export const metadata: Metadata = { title: "Page not found" }

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <span className="font-display text-7xl text-[var(--primary)]" style={{ fontWeight: 800 }}>
        404
      </span>
      <h1 className="font-display mt-4 text-3xl tracking-tight" style={{ fontWeight: 700 }}>
        Page not found
      </h1>
      <p className="mt-3 text-[var(--muted)]">
        That brick doesn&apos;t click into place. The page may have moved, or the address may be mistyped — one of
        these is likely what you were after.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <ExploreMore to="/shop" label="Shop all models" />
        <ExploreMore to="/best-sellers" label="Best sellers" />
      </div>
      <Link
        href="/"
        className="mat-btn mt-6 rounded-full bg-[var(--primary)] px-7 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-2)] hover:brightness-105"
      >
        Back to home
      </Link>
    </section>
  )
}
