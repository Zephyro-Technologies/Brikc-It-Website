"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { SectionHead } from "./ui"
import type { FaqItem } from "../data"

export function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0)
  if (items.length === 0) return null

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <SectionHead
        kicker="FAQ"
        title="Good to know"
        desc="Answers to the questions shoppers ask most before they order."
      />
      <div className="divide-y divide-[var(--border)] overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-1)]">
        {items.map((f, i) => {
          const active = open === i
          return (
            <div key={`${i}-${f.q}`} className="px-6">
              <button
                type="button"
                onClick={() => setOpen(active ? null : i)}
                aria-expanded={active}
                className="mat-btn flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="font-display text-lg" style={{ fontWeight: 700 }}>
                  {f.q}
                </span>
                <Plus
                  className={`h-5 w-5 flex-none text-[var(--primary)] transition-transform duration-300 ${
                    active ? "rotate-45" : ""
                  }`}
                />
              </button>
              <div className={`grid transition-all duration-300 ${active ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"}`}>
                <p className="overflow-hidden leading-relaxed text-[var(--muted)]">{f.a}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
