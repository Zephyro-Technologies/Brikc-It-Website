"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { fromPrice, type Category, type Product } from "../data"
import { ProductCard, Reveal, SectionHead } from "./ui"

const CATS: (Category | "All")[] = ["All", "F1", "Cars", "Bikes", "Collector"]
const SORTS = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
] as const

type SortKey = (typeof SORTS)[number]["key"]

export default function ShopView({ products: all }: { products: Product[] }) {
  const params = useSearchParams()
  const router = useRouter()
  const active = (params.get("cat") as Category | null) ?? "All"
  const [sort, setSort] = useState<SortKey>("featured")

  const setCat = (c: Category | "All") => {
    if (c === "All") router.push("/shop")
    else router.push(`/shop?cat=${c}`)
  }

  const products = useMemo(() => {
    const list = active === "All" ? [...all] : all.filter((p) => p.category === active)
    if (sort === "price-asc") list.sort((a, b) => fromPrice(a) - fromPrice(b))
    else if (sort === "price-desc") list.sort((a, b) => fromPrice(b) - fromPrice(a))
    else list.sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
    return list
  }, [active, sort, all])

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <SectionHead
        title="Shop"
        desc="Boxed, built, or framed — filter by what you're after, then tap any model for details."
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => {
            const isActive = active === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={`mat-btn rounded-full px-4 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-[var(--primary)] text-white shadow-[var(--shadow-1)]"
                    : "border border-[var(--border)] bg-white text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {c}
              </button>
            )
          })}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <span className="font-medium text-[var(--muted)]">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="mat-btn rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow-1)] outline-none focus:border-[var(--primary)]"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {products.length > 0 && (
        <p className="mb-6 text-sm text-[var(--muted)]">
          {products.length} {products.length === 1 ? "build" : "builds"} in{" "}
          {active === "All" ? "the range" : active}
        </p>
      )}

      {products.length === 0 ? (
        <div className="mt-4 rounded-3xl bg-white px-6 py-20 text-center shadow-[var(--shadow-1)]">
          <p className="font-display text-xl" style={{ fontWeight: 800 }}>
            {all.length === 0 ? "Nothing here yet" : `No ${active} builds right now`}
          </p>
          <p className="mx-auto mt-3 max-w-sm text-[var(--muted)]">
            {all.length === 0
              ? "New builds are on their way — check back soon."
              : "Everything else is still worth a look."}
          </p>
          {all.length > 0 && (
            <button
              type="button"
              onClick={() => setCat("All")}
              className="mat-btn mt-6 rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-1)] hover:bg-black hover:shadow-[var(--shadow-2)]"
            >
              Show every build
            </button>
          )}
        </div>
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
