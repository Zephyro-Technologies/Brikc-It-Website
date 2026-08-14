"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { fromPrice, type Category, type Product } from "../data"
import { ProductCard } from "./ProductCard"

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
    let list = active === "All" ? all : all.filter((p) => p.category === active)
    list = [...list]
    if (sort === "price-asc") list.sort((a, b) => fromPrice(a) - fromPrice(b))
    else if (sort === "price-desc") list.sort((a, b) => fromPrice(b) - fromPrice(a))
    else list.sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
    return list
  }, [active, sort, all])

  return (
    <div className="mx-auto max-w-7xl px-5 pt-28 pb-24 md:pt-36">
      <p className="ff-mono mb-3 text-xs tracking-[0.3em] text-[#ff6b4a] uppercase">The collection</p>
      <h1 className="ff-display text-4xl font-black tracking-tight md:text-6xl">Shop all builds</h1>
      <p className="mt-4 max-w-xl text-zinc-400">
        Boxed, built, or framed with LED — each build sets its own options.
        {products.length > 0 &&
          ` ${products.length} ${products.length === 1 ? "build" : "builds"} in ${active === "All" ? "the range" : active}.`}
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-y border-white/10 py-4">
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`ff-mono rounded-full border px-4 py-1.5 text-xs tracking-widest uppercase transition-colors ${
                active === c
                  ? "border-[#e63329] bg-[#e63329] text-white"
                  : "border-white/15 text-zinc-400 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2">
          <span className="ff-mono text-[11px] tracking-widest text-zinc-500 uppercase">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="ff-mono rounded-md border border-white/15 bg-[#101012] px-3 py-1.5 text-xs tracking-wider text-zinc-200 outline-none focus:border-[#e63329]"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {products.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-[#101012] px-6 py-20 text-center">
          <p className="ff-display text-xl font-extrabold">
            {all.length === 0 ? "Nothing here yet" : `No ${active} builds right now`}
          </p>
          <p className="mx-auto mt-3 max-w-sm text-zinc-400">
            {all.length === 0
              ? "The first builds are on their way. Follow along on Instagram and you'll see them as they land."
              : "Everything else is still worth a look."}
          </p>
          {all.length > 0 && (
            <button
              onClick={() => setCat("All")}
              className="mt-6 rounded-full border border-white/20 px-6 py-3 ff-display font-semibold hover:bg-white/5"
            >
              Show every build
            </button>
          )}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
