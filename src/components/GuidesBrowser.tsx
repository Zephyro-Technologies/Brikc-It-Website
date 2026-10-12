"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import type { Product, StoreCategory } from "../data"
import { subline } from "../lib/product-view"
import { ManualCard } from "./ManualCard"
import { Reveal } from "./ui"

const ALL = "all"

/**
 * The /guides list, with a search box and the shop's category chips over it —
 * one card per build, and there will be a lot of builds.
 *
 * Filtered in the browser, not through the URL as /shop is: the page stays
 * prerendered, and a manual list is something you search and download from,
 * not a view anybody shares. The whole catalogue is already on the page.
 *
 * Search matches the build's name, the line under it ("F1 · 1:8") and every
 * category it sits in, ignoring case, accents and punctuation, and every word
 * typed has to match somewhere — "red bull 1:8" narrows rather than widens.
 */
export default function GuidesBrowser({
  products,
  categories,
}: {
  /** Ready-to-download first, then the ones still being written. */
  products: Product[]
  categories: StoreCategory[]
}) {
  const [query, setQuery] = useState("")
  const [cat, setCat] = useState(ALL)
  const [readyOnly, setReadyOnly] = useState(false)

  // Only categories something on this page sits in — a chip that can only
  // ever show "no results" is a dead end, and displays have none anyway.
  const chips = useMemo(
    () => categories.filter((c) => products.some((p) => inCategory(p, c.name))),
    [categories, products],
  )
  const category = chips.find((c) => c.slug === cat)

  const shown = filterGuides(products, { query, category: category?.name, readyOnly })
  const filtering = query.trim() !== "" || category !== undefined || readyOnly
  const anyReady = products.some((p) => p.manual.url !== "")

  function reset() {
    setQuery("")
    setCat(ALL)
    setReadyOnly(false)
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by build, team or scale"
            aria-label="Search the assembly guides"
            className="w-full rounded-full border border-[var(--border)] bg-white py-3 pr-12 pl-12 text-base shadow-[var(--shadow-1)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--foreground)] [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear the search"
              className="mat-btn absolute top-1/2 right-3 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {/* The shop's chips, in the shop's shape. One chip is no filter at
                all, so the row only appears once there is a choice to make. */}
            {chips.length > 1 &&
              [{ slug: ALL, name: "All" }, ...chips].map((c) => {
                const active = cat === c.slug
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setCat(c.slug)}
                    aria-pressed={active}
                    className={`mat-btn rounded-full px-4 py-2 text-sm font-medium ${
                      active
                        ? "bg-[var(--primary)] text-white shadow-[var(--shadow-1)]"
                        : "border border-[var(--border)] bg-white text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {c.name}
                  </button>
                )
              })}
          </div>

          {/* A switch, not another chip: whether a manual is written yet is a
              way of reading the list, not a kind of build. */}
          {anyReady && products.some((p) => p.manual.url === "") && (
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--muted)]">
              <input
                type="checkbox"
                checked={readyOnly}
                onChange={(e) => setReadyOnly(e.target.checked)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Ready to download only
            </label>
          )}
        </div>

        <p className="text-sm text-[var(--muted)]" aria-live="polite">
          {filtering
            ? `${shown.length} of ${products.length} ${products.length === 1 ? "build" : "builds"}`
            : `${products.length} ${products.length === 1 ? "build" : "builds"}`}
        </p>
      </div>

      {shown.length > 0 ? (
        // min-w-0 on the items: a grid item defaults to min-width:auto, so a
        // card holding a `truncate` name could not shrink and the whole track
        // grew instead — 172px of page scroll on a long build name.
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>li]:min-w-0">
          {shown.map((product, i) => (
            <li key={product.slug}>
              {/* The delay is capped: twenty cards in, a staggered fade-in is a
                  wait for the one you searched for. */}
              <Reveal delay={Math.min(i, 8) * 40}>
                <ManualCard product={product} />
              </Reveal>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-3xl border border-dashed border-[var(--border)] bg-white/60 p-8 text-center">
          <p className="font-semibold">No guides match that.</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Try fewer words, or another category.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mat-btn mt-4 rounded-full bg-[var(--foreground)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Show every guide
          </button>
        </div>
      )}

      {!anyReady && (
        <p className="mt-8 text-[var(--muted)]">
          No manuals are up yet. They&rsquo;re being written build by build.
        </p>
      )}
    </>
  )
}

/**
 * The builds that answer to a search, a category and the ready-only switch.
 * Every word typed has to appear in the build's name, the line under it or one
 * of its categories.
 */
export function filterGuides(
  products: Product[],
  { query, category, readyOnly }: { query: string; category?: string; readyOnly: boolean },
): Product[] {
  const words = fold(query).split(" ").filter(Boolean)
  return products.filter((p) => {
    if (category && !inCategory(p, category)) return false
    if (readyOnly && p.manual.url === "") return false
    if (words.length === 0) return true
    const text = fold([p.name, subline(p), ...p.categories, p.category].join(" "))
    // And with the spaces out, so "redbull" finds "Red Bull" and "sf24" finds
    // "SF-24".
    const squashed = text.replace(/ /g, "")
    return words.every((w) => text.includes(w) || squashed.includes(w))
  })
}

/** Membership, as the shop filters: a build in three categories answers to all three. */
function inCategory(p: Product, name: string): boolean {
  return p.categories.length > 0 ? p.categories.includes(name) : p.category === name
}

/**
 * Lowercase, accents off, punctuation to spaces — so "Formula 1™", "formula 1"
 * and "FORMULA-1" all read the same. Colons stay, for scales like "1:8".
 */
function fold(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9:]+/g, " ")
    .trim()
}
