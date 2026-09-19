"use client"

import { useMemo, useState } from "react"
import { ChevronDown } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { fromPrice, type Product, type StoreCategory } from "../data"
import { ComingSoon, ProductCard, Reveal, SectionHead } from "./ui"

const SORTS = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
] as const

type SortKey = (typeof SORTS)[number]["key"]

/** What "no filter" looks like in the URL and in state. Never a category slug. */
const ALL = "all"

export default function ShopView({
  products: all,
  categories,
}: {
  products: Product[]
  /**
   * Whatever the admin has created, already in its chosen order. There is no
   * fixed list: a shop with no categories shows no chips, and a category added
   * this morning is a chip this afternoon.
   */
  categories: StoreCategory[]
}) {
  const params = useSearchParams()
  const router = useRouter()
  const [sort, setSort] = useState<SortKey>("featured")

  // `?cat=` carries the slug, not the name, so renaming a category in the admin
  // doesn't break a link someone has already shared. An unknown slug — a deleted
  // category, a typo — falls back to showing everything rather than an empty grid.
  const requested = params.get("cat")
  const match = categories.find((c) => c.slug === requested)
  const active = match ? match.slug : ALL
  const activeName = match?.name ?? ""

  const setCat = (slug: string) => {
    router.push(slug === ALL ? "/shop" : `/shop?cat=${slug}`)
  }

  const products = useMemo(() => {
    const list =
      active === ALL ? [...all] : all.filter((p) => p.category === activeName)
    if (sort === "price-asc") list.sort((a, b) => fromPrice(a) - fromPrice(b))
    else if (sort === "price-desc") list.sort((a, b) => fromPrice(b) - fromPrice(a))
    else list.sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
    return list
  }, [active, activeName, sort, all])

  const chips = [{ slug: ALL, name: "All" }, ...categories]

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <SectionHead
        title="Shop"
        desc="Boxed, built, or framed — filter by what you're after, then tap any model for details."
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {/* One chip is no filter at all, so the row only earns its place once
              there is something to choose between. */}
          {categories.length > 0 &&
            chips.map((c) => {
              const isActive = active === c.slug
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setCat(c.slug)}
                  className={`mat-btn rounded-full px-4 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-[var(--primary)] text-white shadow-[var(--shadow-1)]"
                      : "border border-[var(--border)] bg-white text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {c.name}
                </button>
              )
            })}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <span className="font-medium text-[var(--muted)]">Sort</span>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              // appearance-none drops the native arrow, which the browser
              // crams into whatever padding it finds; the one below sits where
              // it is put. Same treatment as the selects on the checkout.
              className="mat-btn w-full appearance-none rounded-full border border-[var(--border)] bg-white py-2 pr-10 pl-4 text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow-1)] outline-none focus:border-[var(--primary)]"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          </div>
        </label>
      </div>

      {products.length > 0 && (
        <p className="mb-6 text-sm text-[var(--muted)]">
          {products.length} {products.length === 1 ? "build" : "builds"} in{" "}
          {active === ALL ? "the range" : activeName}
        </p>
      )}

      {products.length === 0 ? (
        all.length === 0 ? (
          <ComingSoon note="The first builds are on their way." />
        ) : (
          <div className="mt-4 rounded-3xl bg-white px-6 py-20 text-center shadow-[var(--shadow-1)]">
            <p className="font-display text-xl" style={{ fontWeight: 800 }}>
              No {activeName} builds right now
            </p>
            <p className="mx-auto mt-3 max-w-sm text-[var(--muted)]">
              Everything else is still worth a look.
            </p>
            <button
              type="button"
              onClick={() => setCat(ALL)}
              className="mat-btn mt-6 rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-1)] hover:bg-black hover:shadow-[var(--shadow-2)]"
            >
              Show every build
            </button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {products.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 4) * 70}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  )
}
