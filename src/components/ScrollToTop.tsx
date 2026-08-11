"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function ScrollToTop() {
  const pathname = usePathname()
  const search = useSearchParams().toString()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname, search])
  return null
}
