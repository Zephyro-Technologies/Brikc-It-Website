"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Check, Flame, Minus, Plus, ShoppingBag, Timer } from "lucide-react"
import { useCart } from "../cart"
import { money } from "../lib/money"
import { imageProps } from "../lib/media"
import { useShopSettings } from "../lib/shop-settings"
import { productImage } from "../lib/product-view"
import { Reveal } from "./ui"
import type { Product } from "../data"
import {
  BF_DEALS,
  BF_DOUBLE,
  BF_END_MS,
  BF_START_MS,
  BUILDER_SLUGS,
  BUILDER_TIERS,
  bfLineKey,
  bfUnitPrice,
  saleFormat,
  type BfSelection,
  type BfState,
  bfState,
} from "../lib/black-friday"

/** The deal's own assembly and everyday price — one resolver for card and cart. */
function dealSold(p: Product) {
  return saleFormat({
    sellsBoxed: p.formats.boxed,
    sellsBuilt: p.formats.built,
    priceBoxed: p.prices.boxed,
    priceBuilt: p.prices.built,
  })
}

/**
 * The sale page. Every price on it comes from src/lib/black-friday.ts and
 * every stock figure from the live catalogue the server handed over; nothing
 * here invents a number. The date gating runs on the visitor's clock for the
 * copy and the buttons — and again on the server's clock in /api/bf/order,
 * which is the one that counts.
 */

const DARK = "#0b0b0d" // the chrome black the header and footer already use

function pct(from: number, to: number): number {
  return Math.round((1 - to / from) * 100)
}

/* ── Countdown ─────────────────────────────────────────────────────────── */

function parts(msLeft: number) {
  const s = Math.max(0, Math.floor(msLeft / 1000))
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  }
}

function Countdown({ until, label }: { until: number; label: string }) {
  // Rendered only after mount (the page shows a quiet placeholder first), so
  // the server markup and the first client paint never disagree about seconds.
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const p = parts((until - (now ?? until)) | 0)
  const cell = (n: number, unit: string) => (
    <div className="flex flex-col items-center rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm sm:px-4">
      <span className="font-display text-2xl tabular-nums text-white sm:text-3xl" style={{ fontWeight: 800 }}>
        {now === null ? "–" : String(n).padStart(2, "0")}
      </span>
      <span className="text-[10px] tracking-widest text-white/60 uppercase">{unit}</span>
    </div>
  )
  return (
    <div>
      <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-white/70 uppercase">
        <Timer className="h-3.5 w-3.5" /> {label}
      </p>
      <div className="flex gap-2">
        {cell(p.d, "days")}
        {cell(p.h, "hrs")}
        {cell(p.m, "min")}
        {cell(p.s, "sec")}
      </div>
    </div>
  )
}

/* ── Shared bits ───────────────────────────────────────────────────────── */

function StockBadge({ product }: { product: Product }) {
  const { lowStockAt } = useShopSettings()
  if (!product.inStock)
    return <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white">Sold out</span>
  if (lowStockAt > 0 && product.stock <= lowStockAt)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)] px-2.5 py-1 text-[11px] font-semibold text-white">
        <Flame className="h-3 w-3" /> Only {product.stock} left
      </span>
    )
  return null
}

function SalePrice({ was, now }: { was: number; now: number }) {
  return (
    <span className="flex flex-wrap items-baseline gap-x-2">
      <span className="text-sm text-[var(--muted)] line-through">{money(was)}</span>
      <span className="font-display text-xl text-[var(--primary-deep)]" style={{ fontWeight: 800 }}>
        {money(now)}
      </span>
      <span className="rounded-md bg-[var(--primary)]/10 px-1.5 py-0.5 text-xs font-bold text-[var(--primary-deep)]">
        −{pct(was, now)}%
      </span>
    </span>
  )
}

/* ── The page ──────────────────────────────────────────────────────────── */

export default function BlackFridayView({ products }: { products: Product[] }) {
  const { addBfLine } = useCart()
  const bySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products])

  // The visitor's clock decides what the page says; checked once a second so
  // the stroke of midnight flips it without a reload. The server's clock
  // decides what can actually be ordered.
  const [state, setState] = useState<BfState | null>(null)
  useEffect(() => {
    setState(bfState())
    const t = setInterval(() => setState(bfState()), 1000)
    return () => clearInterval(t)
  }, [])
  const live = state === "live"

  /* ── Builder state ── */
  const cars = BUILDER_SLUGS.map((s) => bySlug.get(s)).filter(
    (p): p is Product => !!p && p.kind === "model" && p.formats.boxed && p.inStock,
  )
  const [picks, setPicks] = useState<Record<string, number>>({})
  const count = Object.values(picks).reduce((n, q) => n + q, 0)
  const compareAt = Object.entries(picks).reduce(
    (n, [slug, q]) => n + (bySlug.get(slug)?.prices.boxed ?? 0) * q,
    0,
  )
  const tierPrice = BUILDER_TIERS[count]
  const maxPicks = Math.max(...Object.keys(BUILDER_TIERS).map(Number))

  const bump = (p: Product, d: number) =>
    setPicks((prev) => {
      const next = Math.max(0, Math.min((prev[p.slug] ?? 0) + d, p.stock))
      const total = count - (prev[p.slug] ?? 0) + next
      if (total > maxPicks) return prev
      const out = { ...prev }
      if (next === 0) delete out[p.slug]
      else out[p.slug] = next
      return out
    })

  const [added, setAdded] = useState<string | null>(null)
  function confirm(key: string) {
    setAdded(key)
    setTimeout(() => setAdded((a) => (a === key ? null : a)), 1800)
  }

  function addBuilder() {
    if (!live || !tierPrice) return
    const sel: BfSelection = {
      kind: "builder",
      tier: count,
      picks: Object.entries(picks).map(([slug, qty]) => ({
        slug,
        name: bySlug.get(slug)?.name.replace(/\s*·\s*Speed Champions$/i, "") ?? slug,
        qty,
      })),
    }
    const first = bySlug.get(sel.picks[0].slug)
    addBfLine({
      key: bfLineKey(sel),
      slug: `blessed-friday-pick-${count}`,
      name: `Speed Champions Bundle — pick ${count}`,
      team: "Blessed Friday",
      image: first ? productImage(first) : "",
      kind: "bundle",
      bf: sel,
      unitPrice: tierPrice,
      qty: 1,
    })
    setPicks({})
  }

  function addDeal(p: Product) {
    if (!live) return
    const sel: BfSelection = { kind: "deal", slug: p.slug }
    addBfLine(
      {
        key: bfLineKey(sel),
        slug: p.slug,
        name: `${p.name} — Blessed Friday`,
        team: p.team,
        image: productImage(p),
        kind: "model",
        bf: sel,
        unitPrice: bfUnitPrice(sel),
        qty: 1,
      },
      { open: false },
    )
    confirm(bfLineKey(sel))
  }

  function addDouble() {
    if (!live) return
    const sel: BfSelection = { kind: "double" }
    const first = bySlug.get(BF_DOUBLE.slugs[0])
    addBfLine({
      key: bfLineKey(sel),
      slug: "blessed-friday-double",
      name: "RB20 + McLaren Double — Blessed Friday",
      team: "Blessed Friday",
      image: first ? productImage(first) : "",
      kind: "bundle",
      bf: sel,
      unitPrice: BF_DOUBLE.price,
      qty: 1,
    })
  }

  /* ── The three date states ── */

  if (state === "ended") {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        <p className="text-xs font-semibold tracking-widest text-[var(--primary)] uppercase">Blessed Friday</p>
        <h1 className="font-display mt-3 text-4xl tracking-tight" style={{ fontWeight: 800 }}>
          That&rsquo;s a wrap.
        </h1>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-[var(--muted)]">
          The Blessed Friday sale ended on 30 November. Whatever survived it is back at its
          everyday price in the shop.
        </p>
        <Link
          href="/shop"
          className="mat-btn mt-8 inline-block rounded-full bg-[var(--primary)] px-7 py-3.5 font-display text-white shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)]"
          style={{ fontWeight: 700 }}
        >
          Browse the shop
        </Link>
      </div>
    )
  }

  const deals = Object.keys(BF_DEALS)
    .map((s) => bySlug.get(s))
    .filter((p): p is Product => !!p)
  const doubleMembers = BF_DOUBLE.slugs.map((s) => bySlug.get(s)).filter((p): p is Product => !!p)
  const doubleOk = doubleMembers.length === 2 && doubleMembers.every((p) => p.inStock && p.formats.boxed)
  const doubleWas = doubleMembers.reduce((n, p) => n + p.prices.boxed, 0)

  return (
    <div>
      {/* ── Hero ── */}
      <section style={{ backgroundColor: DARK }} className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: "radial-gradient(80% 120% at 85% 0%, #b8102233 0%, transparent 60%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold tracking-widest text-white/80 uppercase">
            24 – 30 November · Pakistan time
          </p>
          <h1
            className="font-display mt-5 max-w-3xl text-5xl tracking-tight text-white md:text-7xl"
            style={{ fontWeight: 800 }}
          >
            Blessed Friday,
            <span className="block bg-gradient-to-r from-[#f0384a] to-[#d31f2e] bg-clip-text text-transparent">
              brick by brick.
            </span>
          </h1>
          <p className="mt-5 max-w-xl leading-relaxed text-white/70">
            Build your own Speed Champions bundle and take the big models at their lowest
            prices of the year. Every item is stocked one to three deep —{" "}
            <strong className="text-white">when it&rsquo;s gone, it&rsquo;s gone.</strong>
          </p>
          <div className="mt-8">
            {state === null ? null : state === "upcoming" ? (
              <Countdown until={BF_START_MS} label="The sale opens in" />
            ) : (
              <Countdown until={BF_END_MS} label="The sale ends in" />
            )}
          </div>
        </div>
      </section>

      {state === "upcoming" && (
        <div className="border-b border-[var(--border)] bg-[var(--surface-2)] py-3 text-center text-sm text-[var(--muted)]">
          A preview of what&rsquo;s coming — ordering opens shortly.
        </div>
      )}

      {/* ── Builder ── */}
      <section className="mx-auto max-w-6xl px-5 py-14 md:py-20">
        <Reveal>
          <p className="text-xs font-semibold tracking-widest text-[var(--primary)] uppercase">The hero offer</p>
          <h2 className="font-display mt-2 text-3xl tracking-tight md:text-4xl" style={{ fontWeight: 800 }}>
            Build your own Speed&nbsp;Champions bundle
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-[var(--muted)]">
            Pick any <strong>2 for {money(BUILDER_TIERS[2])}</strong>, any{" "}
            <strong>3 for {money(BUILDER_TIERS[3])}</strong>, or any{" "}
            <strong>5 for {money(BUILDER_TIERS[5])}</strong> — mix whichever cars you like,
            sealed kits, while they last.
          </p>
        </Reveal>

        {cars.length === 0 ? (
          <p className="mt-10 rounded-2xl bg-[var(--surface-2)] p-8 text-center text-[var(--muted)]">
            The singles have sold out. The deals below are still live.
          </p>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
              {cars.map((p) => {
                const q = picks[p.slug] ?? 0
                const canAdd = q < p.stock && count < maxPicks
                return (
                  <Reveal key={p.slug}>
                    <div
                      className={`flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-1)] transition-shadow ${
                        q > 0 ? "ring-2 ring-[var(--primary)]" : ""
                      }`}
                    >
                      <div className="relative aspect-square bg-[var(--surface-2)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          {...imageProps(productImage(p), { thumb: true })}
                          alt={p.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <StockBadge product={p} />
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col gap-1.5 p-3">
                        <p className="text-sm font-semibold leading-snug">
                          {p.name.replace(/\s*·\s*Speed Champions$/i, "")}
                        </p>
                        <p className="text-xs text-[var(--muted)]">{money(p.prices.boxed)} alone</p>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          {q === 0 ? (
                            <button
                              type="button"
                              disabled={!canAdd}
                              onClick={() => bump(p, 1)}
                              className="mat-btn w-full rounded-full border border-[var(--border)] bg-white py-1.5 text-sm font-semibold hover:bg-[var(--surface-2)] disabled:opacity-40"
                            >
                              Pick
                            </button>
                          ) : (
                            <div className="flex w-full items-center justify-between rounded-full bg-[var(--primary)] px-1.5 py-1 text-white">
                              <button type="button" onClick={() => bump(p, -1)} aria-label={`One fewer ${p.name}`} className="mat-btn grid h-7 w-7 place-items-center rounded-full hover:bg-white/15">
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="font-display text-sm" style={{ fontWeight: 700 }}>{q}</span>
                              <button type="button" onClick={() => bump(p, 1)} disabled={!canAdd} aria-label={`One more ${p.name}`} className="mat-btn grid h-7 w-7 place-items-center rounded-full hover:bg-white/15 disabled:opacity-40">
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Reveal>
                )
              })}
            </div>

            {/* The tally — sticks to the bottom while picking. */}
            <div className="sticky bottom-3 z-10 mt-6">
              <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-white/95 px-5 py-4 shadow-[var(--shadow-3)] backdrop-blur">
                <div>
                  <p className="text-sm font-semibold">
                    {count === 0
                      ? "Pick your cars"
                      : tierPrice
                        ? `${count} car${count > 1 ? "s" : ""} picked`
                        : count < 2
                          ? "Pick 1 more for the 2-car price"
                          : count === 4
                            ? "Add 1 more for the 5-car price — or take one out"
                            : `${count} picked`}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {count > 0 && tierPrice ? (
                      <>
                        Worth <span className="line-through">{money(compareAt)}</span> — you save{" "}
                        <strong className="text-[var(--primary-deep)]">{money(compareAt - tierPrice)}</strong>
                      </>
                    ) : (
                      `Any 2 · ${money(BUILDER_TIERS[2])}   ·   any 3 · ${money(BUILDER_TIERS[3])}   ·   any 5 · ${money(BUILDER_TIERS[5])}`
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addBuilder}
                  disabled={!live || !tierPrice}
                  className="mat-btn inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 font-display text-white shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)] disabled:opacity-40"
                  style={{ fontWeight: 700 }}
                >
                  <ShoppingBag className="h-4 w-4" />
                  {tierPrice ? `Add bundle · ${money(tierPrice)}` : "Add bundle"}
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── Big model deals ── */}
      <section className="border-t border-[var(--border)] bg-[var(--surface-2)]">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <Reveal>
            <p className="text-xs font-semibold tracking-widest text-[var(--primary)] uppercase">Big model deals</p>
            <h2 className="font-display mt-2 text-3xl tracking-tight md:text-4xl" style={{ fontWeight: 800 }}>
              The shelf queens, slashed
            </h2>
          </Reveal>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((p) => {
              const bf = BF_DEALS[p.slug]
              const sel: BfSelection = { kind: "deal", slug: p.slug }
              const isAdded = added === bfLineKey(sel)
              const sold = dealSold(p)
              const can = live && p.inStock && !!sold
              return (
                <Reveal key={p.slug}>
                  <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-1)]">
                    <Link href={`/shop/${p.slug}`} className="relative block aspect-[4/3] bg-[var(--surface-2)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        {...imageProps(productImage(p), { thumb: true })}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <StockBadge product={p} />
                      </div>
                    </Link>
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <p className="font-display text-lg leading-snug" style={{ fontWeight: 700 }}>
                        {p.name}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {p.scale && `${p.scale} · `}
                        {sold?.format === "built" ? "Assembled, ready to display" : "Sealed kit, unassembled"}
                      </p>
                      <SalePrice was={sold?.price ?? 0} now={bf} />
                      <div className="mt-auto pt-3">
                        <button
                          type="button"
                          disabled={!can}
                          onClick={() => addDeal(p)}
                          className={`mat-btn w-full rounded-full py-2.5 font-display text-white shadow-[var(--shadow-1)] disabled:opacity-40 ${
                            isAdded ? "bg-green-700" : "bg-[var(--primary)] hover:shadow-[var(--shadow-2)]"
                          }`}
                          style={{ fontWeight: 700 }}
                        >
                          {isAdded ? (
                            <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" /> In the cart</span>
                          ) : p.inStock ? (
                            "Add to cart"
                          ) : (
                            "Sold out"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </Reveal>
              )
            })}

            {/* The double */}
            <Reveal>
              <div className="flex h-full flex-col overflow-hidden rounded-2xl text-white shadow-[var(--shadow-2)]" style={{ backgroundColor: DARK }}>
                <div className="grid grid-cols-2 gap-px bg-white/10">
                  {doubleMembers.map((p) => (
                    <div key={p.slug} className="relative aspect-[4/3] bg-[#121114]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        {...imageProps(productImage(p), { thumb: true })}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover opacity-90"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <p className="font-display text-lg leading-snug" style={{ fontWeight: 700 }}>
                    RB20 + McLaren — the double
                  </p>
                  <p className="text-xs text-white/60">Both 1:8 kits, unassembled, one box each</p>
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm text-white/50 line-through">{money(doubleWas)}</span>
                    <span className="font-display text-xl" style={{ fontWeight: 800 }}>
                      {money(BF_DOUBLE.price)}
                    </span>
                    {doubleWas > 0 && (
                      <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-xs font-bold">
                        −{pct(doubleWas, BF_DOUBLE.price)}%
                      </span>
                    )}
                  </span>
                  {!doubleOk && (
                    <p className="text-xs text-white/60">
                      Needs both kits on the shelf — one of them has sold out.
                    </p>
                  )}
                  <div className="mt-auto pt-3">
                    <button
                      type="button"
                      disabled={!live || !doubleOk}
                      onClick={addDouble}
                      className="mat-btn w-full rounded-full bg-[var(--primary)] py-2.5 font-display text-white shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)] disabled:opacity-40"
                      style={{ fontWeight: 700 }}
                    >
                      {doubleOk ? "Add the pair" : "Sold out"}
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Fine print ── */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <ul className="space-y-1.5 text-xs leading-relaxed text-[var(--muted)]">
          <li>
            The bundles are sold <strong>unassembled</strong> (sealed kits); each big-model deal&rsquo;s
            card says whether it comes sealed or assembled. Framed and other options stay available at
            everyday prices on each build&rsquo;s own page.
          </li>
          <li>
            Stock is genuinely one to three units per item and is confirmed again when your order is
            placed — if something sells out under you, the checkout will say so.
          </li>
          <li>Sale prices can&rsquo;t be combined with discount codes.</li>
          <li>
            All kits are brick-built models; each build&rsquo;s own page carries its full details and
            compatibility notes, and the notice in the footer applies shop-wide.
          </li>
        </ul>
      </section>
    </div>
  )
}
