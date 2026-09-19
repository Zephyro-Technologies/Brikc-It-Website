"use client"

import { createContext, useContext, type ReactNode } from "react"

/**
 * The handful of shop-wide settings a card needs to render itself.
 *
 * `lowStockAt` decides when a card starts saying "Only 2 left". Cards are drawn
 * on five different pages, and threading one number from each of them down into
 * `ProductCard` would mean a page that forgot it silently stopped warning
 * anybody. The root layout already loads the settings on every request, so it
 * publishes them here once and the cards read them wherever they are.
 */
export type ShopSettings = { lowStockAt: number }

/** Zero is the off switch, so a tree with no provider simply shows no nudge. */
const Ctx = createContext<ShopSettings>({ lowStockAt: 0 })

export function ShopSettingsProvider({
  value,
  children,
}: {
  value: ShopSettings
  children: ReactNode
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useShopSettings(): ShopSettings {
  return useContext(Ctx)
}
