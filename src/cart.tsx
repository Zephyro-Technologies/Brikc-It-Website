"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  FORMAT_LABELS,
  FRAME_LABELS,
  priceOf,
  type FormatKey,
  type FrameChoice,
  type Product,
  type ProductKind,
  type Variant,
} from "./data"
import { productImage } from "./lib/product-view"

export type CartLine = {
  key: string
  slug: string
  name: string
  team: string
  image: string
  kind: ProductKind
  /** Set for a model line. */
  format?: FormatKey
  /** Set for a model line: which frame was added on top, if any. */
  frame?: FrameChoice
  /** Set for a display line. */
  variantId?: string
  /** Set for a display line — the size label, for the drawer and the summary. */
  variantLabel?: string
  unitPrice: number
  qty: number
}

/**
 * How a line was chosen.
 *
 * A bundle is `{ bundle: true }` — there is nothing to choose, because the
 * assembly and frame of every member were fixed when the bundle was built.
 */
type CartChoice =
  | { format: FormatKey; frame?: FrameChoice }
  | { variant: Variant }
  | { bundle: true }

/**
 * What a line is, in words: "Assembled + LED frame", "Unassembled", "60×90cm".
 *
 * One place rather than three, because the drawer, the checkout summary and the
 * confirmation all have to say the same thing about the same line — and a line
 * bought with a frame that reads simply "Assembled" is a line whose price looks
 * wrong.
 */
export function lineLabel(line: CartLine): string {
  if (line.kind === "display") return line.variantLabel ?? ""
  // A bundle's own line says nothing about options; the drawer shows what is
  // in it underneath, which is the useful thing to read.
  if (line.kind === "bundle") return "Bundle"
  const base = line.format ? FORMAT_LABELS[line.format] : ""
  if (!line.frame || line.frame === "none") return base
  return `${base} + ${FRAME_LABELS[line.frame].toLowerCase()}`
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
  add: (product: Product, choice: CartChoice, qty?: number, opts?: { open?: boolean }) => void
  remove: (key: string) => void
  setQty: (key: string, qty: number) => void
  clear: () => void
}

const Ctx = createContext<CartCtx | null>(null)

// v4: a frame is lit or unlit now, so a line says WHICH frame rather than
// whether there is one — an old line's `framed: true` has no room in the new
// shape and would silently become "no frame", quietly dropping something the
// shopper had chosen and paid attention to. Dropped rather than migrated.
//
// v3: the frame stopped being a third format and became an extra on top of an
// assembly, so a line saved before that can be holding format:"framed" — a
// choice the shop no longer sells and place_order now refuses. Bumping the key
// drops those carts rather than carrying a price nobody can pay to the
// checkout. A lost cart is better than one that fails at the last step.
//
// (v2 did the same when display lines started carrying a variant.)
const STORAGE_KEY = "brikc.cart.v4"

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

  const add: CartCtx["add"] = (product, choice, qty = 1, opts) => {
    const isBundle = "bundle" in choice
    const isVariant = "variant" in choice
    // A lit frame, an unlit one and none at all are three different lines, so
    // adding more than one keeps them apart in the drawer instead of merging
    // into a quantity of two.
    const frame: FrameChoice = isVariant || isBundle ? "none" : (choice.frame ?? "none")
    // A bundle comes one way, so its slug is the whole key — two of it is a
    // quantity of two, never two lines.
    const key = isBundle
      ? product.slug
      : isVariant
        ? `${product.slug}-${choice.variant.id}`
        : `${product.slug}-${choice.format}${frame === "none" ? "" : `-${frame}`}`
    const unitPrice = isBundle
      ? product.bundlePrice
      : isVariant
        ? choice.variant.price
        : priceOf(product, choice.format, frame)
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
          // Never "" — an empty src makes the browser re-request the whole page,
          // and a swatch-only display has no photograph to give. productImage()
          // hands back a neutral tile instead.
          image: productImage(product),
          kind: product.kind,
          ...(isBundle
            ? {}
            : isVariant
              ? { variantId: choice.variant.id, variantLabel: choice.variant.label }
              : { format: choice.format, frame }),
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
