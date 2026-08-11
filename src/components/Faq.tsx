"use client"

import { useState } from "react"
import type { FaqItem } from "../data"

export function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0)
  if (items.length === 0) return null

  return (
    <section className="mx-auto max-w-3xl px-5 py-24">
      <p className="ff-mono mb-3 text-xs tracking-[0.3em] text-[#ff6b4a] uppercase">FAQ</p>
      <h2 className="ff-display mb-10 text-4xl font-extrabold tracking-tight md:text-5xl">Good to know</h2>
      <div className="divide-y divide-white/10 border-y border-white/10">
        {items.map((f, i) => {
          const active = open === i
          return (
            <div key={f.q}>
              <button
                onClick={() => setOpen(active ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="ff-display text-lg font-bold">{f.q}</span>
                <span className={`text-2xl text-[#e63329] transition-transform ${active ? "rotate-45" : ""}`}>+</span>
              </button>
              <div className={`grid transition-all duration-300 ${active ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"}`}>
                <p className="overflow-hidden leading-relaxed text-zinc-400">{f.a}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
