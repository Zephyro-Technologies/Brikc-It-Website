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
    <div className="mx-auto max-w-3xl px-5 pt-40 pb-24 text-center">
      <h1 className="ff-display text-3xl font-extrabold">Page not found</h1>
      <p className="mt-3 text-zinc-400">That page isn&apos;t part of the shop.</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-[#e63329] px-6 py-3 ff-display font-bold text-white"
      >
        Back home
      </Link>
    </div>
  )
}
