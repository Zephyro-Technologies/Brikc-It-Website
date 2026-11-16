"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { bfLive } from "../lib/black-friday"

/**
 * The site-wide Blessed Friday strip. A client component on purpose: most pages
 * are prerendered and rebuilt no oftener than hourly, so a server-rendered bar
 * would appear and disappear up to an hour late. Decided in the browser it
 * flips at midnight sharp, on every page, with nothing to redeploy — the same
 * two dates the page and the order route read.
 *
 * Renders nothing outside the sale window, nothing on /black-friday itself,
 * and nothing at checkout, where an upsell banner has no business.
 */
export default function BlackFridayBar() {
  const pathname = usePathname()
  // Mounted false and decided after hydration, so the server markup (no bar)
  // and the first client paint agree; it pops in a frame later during the sale.
  const [show, setShow] = useState(false)
  useEffect(() => {
    const decide = () => setShow(bfLive())
    decide()
    const t = setInterval(decide, 30_000)
    return () => clearInterval(t)
  }, [])

  if (!show || pathname.startsWith("/blessed-friday") || pathname.startsWith("/checkout")) return null

  return (
    <Link
      href="/blessed-friday"
      className="block bg-gradient-to-r from-[#b81022] to-[#d31f2e] px-4 py-2 text-center text-sm font-semibold text-white transition-[filter] hover:brightness-110"
    >
      Blessed Friday is live — bundles from Rs 5,999, ends 30 Nov&nbsp;→
    </Link>
  )
}
