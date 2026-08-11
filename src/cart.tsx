"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import type { FormatKey, Product, Settings } from "./data"

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
  add: (product: Product, format: FormatKey, qty?: number) => void
  remove: (key: string) => void
  setQty: (key: string, qty: number) => void
  clear: () => void
  /** What a format adds to a base price. Comes from settings, not a constant. */
  uplift: Record<FormatKey, number>
}

const Ctx = createContext<CartCtx | null>(null)

export function CartProvider({ children, settings }: { children: ReactNode; settings: Settings }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [open, setOpen] = useState(false)
  const uplift = settings.uplift

  const add: CartCtx["add"] = (product, format, qty = 1) => {
    const key = `${product.slug}-${format}`
    const unitPrice = product.price + (uplift[format] ?? 0)
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
    setOpen(true)
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
    return { lines, count, subtotal, open, setOpen, add, remove, setQty, clear, uplift }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, open, uplift])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}

/** Rupees, no decimals — the store doesn't price in paisa. */
export const money = (n: number) => `Rs ${Math.round(n).toLocaleString("en-PK")}`
