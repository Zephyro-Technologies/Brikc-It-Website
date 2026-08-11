"use client"

import Link from "next/link"
import type { Product } from "../data"
import { money } from "../cart"

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101012] transition-transform hover:-translate-y-1"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="ff-mono absolute left-3 top-3 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[10px] tracking-widest text-zinc-200 uppercase backdrop-blur">
          {product.category}
        </span>
        {!product.inStock && (
          <span className="ff-mono absolute right-3 top-3 rounded-full border border-[#e63329]/50 bg-black/60 px-2.5 py-1 text-[10px] tracking-widest text-[#ff6b4a] uppercase backdrop-blur">
            Sold out
          </span>
        )}
        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 led-glow-soft" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="ff-mono text-[11px] tracking-widest text-[#ff6b4a] uppercase">{product.team}</p>
        <h3 className="ff-display mt-1 text-xl font-extrabold">{product.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{product.blurb}</p>
        <div className="mt-4 flex items-center gap-2">
          {[product.scale, `${product.pieces} pcs`, product.edition].map((s) => (
            <span key={s} className="ff-mono rounded border border-white/10 px-2 py-0.5 text-[10px] tracking-widest text-zinc-400">
              {s}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="ff-display text-lg font-extrabold">
            <span className="text-sm text-zinc-500">from </span>
            {money(product.price)}
          </span>
          <span className="ff-mono text-[11px] tracking-widest text-zinc-300 uppercase transition-colors group-hover:text-white">
            View →
          </span>
        </div>
      </div>
    </Link>
  )
}
