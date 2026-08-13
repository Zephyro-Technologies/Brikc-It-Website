"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, ShoppingBag, Truck, ShieldCheck, ChevronLeft } from "lucide-react"
import { FORMAT_LABELS, type FormatKey, type Product } from "../data"
import { useCart, money } from "../cart"
import { ProductCard } from "./ProductCard"

const FORMAT_ORDER: FormatKey[] = ["boxed", "built", "framed"]
const FORMAT_DESC: Record<FormatKey, string> = {
  boxed: "Sealed, unbuilt set — sourced and shipped safe.",
  built: "Hand-assembled, inspected, and ready to display.",
  framed: "Shadow-box frame with an integrated LED strip.",
}

export default function ProductDetailView({
  product,
  suggestions,
}: {
  product: Product | undefined
  suggestions: Product[]
}) {
  const [format, setFormat] = useState<FormatKey>("framed")
  const [activeImg, setActiveImg] = useState(0)
  const [added, setAdded] = useState(false)
  const { add } = useCart()

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-40 pb-24 text-center">
        <h1 className="ff-display text-3xl font-extrabold">Build not found</h1>
        <p className="mt-3 text-zinc-400">That model isn&apos;t in the collection.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-[#e63329] px-6 py-3 ff-display font-bold text-white">
          Back to shop
        </Link>
      </div>
    )
  }

  // A build can have formats switched off, so never trust the raw state — it may
  // be left over from a product that did sell the format this one doesn't.
  const available = FORMAT_ORDER.filter((f) => product.formats[f])
  const activeFormat = available.includes(format) ? format : available[0]
  const price = product.prices[activeFormat]

  const onAdd = () => {
    if (!product.inStock) return
    add(product, activeFormat)
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <div className="mx-auto max-w-7xl px-5 pt-28 pb-24 md:pt-32">
      <Link href="/shop" className="ff-mono inline-flex items-center gap-1 text-[11px] tracking-widest text-zinc-400 uppercase hover:text-white">
        <ChevronLeft className="h-4 w-4" /> Back to shop
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.images[activeImg]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            {activeFormat === "framed" && <div className="pointer-events-none absolute inset-0 led-glow-soft" />}
          </div>
          <div className="mt-4 flex gap-3">
            {product.images.map((img, i) => (
              <button
                key={img}
                onClick={() => setActiveImg(i)}
                className={`h-20 w-20 overflow-hidden rounded-lg border transition-colors ${
                  activeImg === i ? "border-[#e63329]" : "border-white/10 hover:border-white/30"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Buy card */}
        <div>
          <p className="ff-mono text-xs tracking-[0.3em] text-[#ff6b4a] uppercase">{product.team}</p>
          <h1 className="ff-display mt-2 text-4xl font-black tracking-tight md:text-5xl">{product.name}</h1>

          <div className="mt-4 flex flex-wrap gap-2">
            {[product.scale + " scale", `${product.pieces} pieces`, product.edition].map((s) => (
              <span key={s} className="ff-mono rounded-full border border-white/10 px-3 py-1 text-[11px] tracking-widest text-zinc-300 uppercase">
                {s}
              </span>
            ))}
          </div>

          <p className="mt-6 leading-relaxed text-zinc-300">{product.description}</p>

          {/* Buy card */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#101012] p-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="ff-mono text-[11px] tracking-widest text-zinc-500 uppercase">
                  {FORMAT_LABELS[activeFormat]}
                </p>
                <p className="ff-display text-4xl font-black">{money(price)}</p>
              </div>
              {product.inStock ? (
                <span className="ff-mono text-[11px] tracking-widest text-zinc-500 uppercase">In stock</span>
              ) : (
                <span className="ff-mono text-[11px] tracking-widest text-[#ff6b4a] uppercase">Sold out</span>
              )}
            </div>

            <p className="ff-mono mt-6 mb-3 text-[11px] tracking-widest text-zinc-400 uppercase">Choose format</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {available.map((f) => {
                const on = activeFormat === f
                return (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      on ? "border-[#e63329] bg-[#140b0a]" : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="ff-display font-bold">{FORMAT_LABELS[f]}</span>
                      {on && <Check className="h-4 w-4 text-[#ff6b4a]" />}
                    </div>
                    <span className="ff-mono text-[11px] tracking-wider text-zinc-500">
                      {money(product.prices[f])}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="mt-3 text-sm text-zinc-500">{FORMAT_DESC[activeFormat]}</p>

            <button
              onClick={onAdd}
              disabled={!product.inStock}
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-full py-4 ff-display font-bold text-white transition-transform ${
                !product.inStock
                  ? "cursor-not-allowed border border-white/15 bg-white/5 text-zinc-500"
                  : added
                    ? "bg-emerald-600 hover:scale-[1.02]"
                    : "bg-[#e63329] led-glow-soft hover:scale-[1.02]"
              }`}
            >
              {!product.inStock ? (
                "Sold out"
              ) : added ? (
                <>
                  <Check className="h-5 w-5" /> Added to cart
                </>
              ) : (
                <>
                  <ShoppingBag className="h-5 w-5" /> Add to cart — {money(price)}
                </>
              )}
            </button>
            {!product.inStock && (
              <p className="mt-3 text-center text-sm text-zinc-500">
                This edition has sold out. Follow{" "}
                <a
                  href="https://instagram.com/brikc.it"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#ff6b4a] hover:underline"
                >
                  @brikc.it
                </a>{" "}
                for restocks.
              </p>
            )}

            <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Truck className="h-4 w-4 text-[#ff6b4a]" /> Double-boxed, insured shipping
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <ShieldCheck className="h-4 w-4 text-[#ff6b4a]" /> Inspected before dispatch
              </div>
            </div>
          </div>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-24">
          <h2 className="ff-display mb-8 text-3xl font-extrabold tracking-tight">You might also like</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {suggestions.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
