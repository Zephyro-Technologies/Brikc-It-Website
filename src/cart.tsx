"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { FormatKey, Product } from "./data"

export type CartLine = {
  key: string
  slug: string
  name: string
  team: string
  image: string
  format: FormatKey
  unitPrice: number
  qty: number
}

type CartCtx = {
  lines: CartLine[]
  count: number
  subtotal: number
  open: boolean
  setOpen: (v: boolean) => void
  /**
   * `open` controls whether the drawer slides out. The product page wants it
   * (one deliberate add, show the result); a quick-add chip in a grid doesn't,
   * because covering the grid you're browsing to confirm one tap is a jolt —
   * the chip confirms itself instead.
   */
  add: (product: Product, format: FormatKey, qty?: number, opts?: { open?: boolean }) => void
  remove: (key: string) => void
  setQty: (key: string, qty: number) => void
  clear: () => void
}

const Ctx = createContext<CartCtx | null>(null)

const STORAGE_KEY = "brikc.cart.v1"

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [open, setOpen] = useState(false)

  // Starts empty and fills in after mount rather than reading storage during
  // render: the server has no localStorage, and a cart that differs between the
  // two would be a hydration mismatch.
  const [restored, setRestored] = useState(false)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed: unknown = JSON.parse(saved)
        if (Array.isArray(parsed)) setLines(parsed as CartLine[])
      }
    } catch {
      // Corrupt or unavailable storage isn't worth breaking the shop over.
    }
    setRestored(true)
  }, [])

  useEffect(() => {
    if (!restored) return // don't let the initial empty state clobber a saved cart
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      // Private browsing, quota, etc. The cart still works for this visit.
    }
  }, [lines, restored])

  const add: CartCtx["add"] = (product, format, qty = 1, opts) => {
    const key = `${product.slug}-${format}`
    const unitPrice = product.prices[format]
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key)
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
      }
      return [
        ...prev,
        {
          key,
          slug: product.slug,
          name: product.name,
          team: product.team,
          image: product.images[0] ?? "",
          format,
          unitPrice,
          qty,
        },
      ]
    })
    if (opts?.open !== false) setOpen(true)
  }

  const remove: CartCtx["remove"] = (key) => setLines((prev) => prev.filter((l) => l.key !== key))
  const setQty: CartCtx["setQty"] = (key, qty) =>
    setLines((prev) =>
      prev.flatMap((l) => (l.key === key ? (qty <= 0 ? [] : [{ ...l, qty }]) : [l])),
    )
  const clear = () => setLines([])

  const value = useMemo<CartCtx>(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0)
    const subtotal = lines.reduce((n, l) => n + l.qty * l.unitPrice, 0)
    return { lines, count, subtotal, open, setOpen, add, remove, setQty, clear }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, open])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}

