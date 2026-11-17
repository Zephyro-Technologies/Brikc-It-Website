"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BF_END_MS, PICK2_BUDGET_PRICE, bfLive } from "../lib/black-friday"

/**
 * The site-wide Blessed Friday strip. The layout renders it only inside the
 * sale window (server clock), so no page built after 30 Nov carries it. The
 * effect here covers the HTML rendered before the end — an open tab, or a
 * prerendered page waiting on its rebuild — and takes the bar down at
 * midnight sharp with nothing to redeploy.
 *
 * Renders nothing on /blessed-friday itself, and nothing at checkout, where
 * an upsell banner has no business.
 */
export default function BlackFridayBar() {
  const pathname = usePathname()
  // Shown by default, so the bar is in the server HTML and never pops in and
  // shifts the page after hydration. The layout only renders this inside the
  // window, so the effect's one real job is to take it DOWN after the end.
  const [show, setShow] = useState(true)
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
      Blessed Friday is live — bundles from Rs {PICK2_BUDGET_PRICE.toLocaleString("en-PK")}, ends{" "}
      {new Date(BF_END_MS).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Karachi" })}
      &nbsp;→
    </Link>
  )
}
