"use client"

import { useEffect, useRef, type RefObject } from "react"

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * What every full-screen overlay owes the page under it, for as long as the
 * component calling this is mounted: Escape closes it, the page stops scrolling
 * behind it, focus moves into it, Tab stays inside it, and focus goes back to
 * whatever opened it. Without the focus half a keyboard is left on the page
 * underneath, tabbing through things it cannot see.
 *
 * `keys` handles anything else the overlay listens for — the arrows in a
 * lightbox. Both callbacks are read through a ref, so the listener is attached
 * once and always sees the current ones.
 */
export function useModal(
  dialogRef: RefObject<HTMLElement | null>,
  focusRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  keys?: (e: KeyboardEvent) => void,
) {
  const latest = useRef({ onClose, keys })
  useEffect(() => {
    latest.current = { onClose, keys }
  })

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    focusRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return latest.current.onClose()
      if (e.key === "Tab") return trap(e)
      latest.current.keys?.(e)
    }

    // Tab past the last control comes back to the first, and Shift+Tab the
    // other way, so focus never reaches the page behind.
    const trap = (e: KeyboardEvent) => {
      const dialog = dialogRef.current
      if (!dialog) return
      const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (items.length === 0) return e.preventDefault()
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (!dialog.contains(active)) {
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener("keydown", onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = previous
      // Only if it is still on the page: an opener that unmounted while this
      // was open would take focus nowhere.
      if (opener?.isConnected) opener.focus()
    }
  }, [dialogRef, focusRef])
}
