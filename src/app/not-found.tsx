import Link from "next/link"

/**
 * Unmatched URLs are caught by `[...notfound]`, which renders the home page and
 * returns 200 — so this file is a backstop that is almost never reached.
 *
 * It deliberately does NOT import Home. Next serialises the not-found boundary
 * into every route's payload, so rendering the homepage here shipped the entire
 * home page markup with /shop, every product page and every other route.
 */
export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <span className="font-display text-7xl text-[var(--primary)]" style={{ fontWeight: 800 }}>
        404
      </span>
      <h1 className="font-display mt-4 text-3xl tracking-tight" style={{ fontWeight: 700 }}>
        Page not found
      </h1>
      <p className="mt-3 text-[var(--muted)]">That brick doesn&apos;t click into place. Let&apos;s get you back on track.</p>
      <Link
        href="/"
        className="mat-btn mt-8 rounded-full bg-[var(--primary)] px-7 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-2)] hover:brightness-105"
      >
        Back to home
      </Link>
    </section>
  )
}
