"use client"

import { useState } from "react"
import Link from "next/link"
import { ShoppingBag, Menu, X } from "lucide-react"

function Instagram({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}
// Full horizontal lockup — the wordmark is part of the artwork, so nothing
// needs to set "brikc.it" in type alongside it.
const logo = "/brand/logo.png"
import { useCart, money } from "../cart"
import { FORMAT_LABELS } from "../data"
import { POLICIES } from "../lib/legal"

const NAV = [
  { label: "Shop", to: "/shop" },
  { label: "F1", to: "/shop?cat=F1" },
  { label: "Cars", to: "/shop?cat=Cars" },
  { label: "Bikes", to: "/shop?cat=Bikes" },
]

export function Logo({ className = "" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={logo} alt="brikc.it" className={className} />
}

export function Nav() {
  const [open, setOpen] = useState(false)
  const { count, setOpen: setCartOpen } = useCart()
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#09090a]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex items-center" aria-label="brikc.it — home">
          <Logo className="h-10 w-auto" />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              href={n.to}
              className="ff-mono text-xs tracking-widest text-zinc-400 uppercase transition-colors hover:text-white"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="https://instagram.com/brikc.it"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="hidden h-9 w-9 items-center justify-center rounded-md border border-white/15 text-zinc-300 transition-colors hover:text-white sm:flex"
          >
            <Instagram className="h-4 w-4" />
          </a>
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 rounded-full bg-[#e63329] px-4 py-2.5 ff-display text-sm font-bold text-white transition-transform hover:scale-105 led-glow-soft"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="ff-mono absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-[#e63329]">
                {count}
              </span>
            )}
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white md:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t border-white/10 px-5 py-3 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.to}
              href={n.to}
              onClick={() => setOpen(false)}
              className="ff-mono py-2 text-sm tracking-widest text-zinc-300 uppercase"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}

export function CartDrawer() {
  const { lines, open, setOpen, subtotal, remove, setQty, count, clear } = useCart()
  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0d0d0f] transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="ff-display text-lg font-extrabold">Your cart {count > 0 && `(${count})`}</h2>
          <button onClick={() => setOpen(false)} aria-label="Close" className="text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="h-10 w-10 text-zinc-600" />
            <p className="text-zinc-400">Your cart is empty.</p>
            <Link
              href="/shop"
              onClick={() => setOpen(false)}
              className="rounded-full border border-white/20 px-5 py-2.5 ff-display font-semibold hover:bg-white/5"
            >
              Browse builds
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {lines.map((l) => (
                <div key={l.key} className="flex gap-4 rounded-xl border border-white/10 bg-[#101012] p-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={l.image} alt={l.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="ff-display truncate font-bold">{l.name}</p>
                        <p className="ff-mono text-[11px] tracking-widest text-[#ff6b4a] uppercase">
                          {FORMAT_LABELS[l.format]}
                        </p>
                      </div>
                      <button
                        onClick={() => remove(l.key)}
                        className="text-zinc-500 hover:text-white"
                        aria-label="Remove"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-white/15">
                        <button
                          onClick={() => setQty(l.key, l.qty - 1)}
                          className="px-3 py-1 text-zinc-300 hover:text-white"
                        >
                          −
                        </button>
                        <span className="ff-mono w-6 text-center text-sm">{l.qty}</span>
                        <button
                          onClick={() => setQty(l.key, l.qty + 1)}
                          className="px-3 py-1 text-zinc-300 hover:text-white"
                        >
                          +
                        </button>
                      </div>
                      <span className="ff-display font-bold">{money(l.unitPrice * l.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={clear} className="ff-mono text-[11px] tracking-widest text-zinc-500 uppercase hover:text-white">
                Clear cart
              </button>
            </div>
            <div className="border-t border-white/10 px-5 py-5">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-zinc-400">Subtotal</span>
                <span className="ff-display text-xl font-extrabold">{money(subtotal)}</span>
              </div>
              <p className="ff-mono mb-4 text-[11px] tracking-wider text-zinc-500">
                Shipping &amp; taxes calculated at checkout
              </p>
              <button
                onClick={() => alert("This is a front-end demo — payment isn't wired up yet.")}
                className="w-full rounded-full bg-[#e63329] py-3.5 ff-display font-bold text-white transition-transform hover:scale-[1.02] led-glow-soft"
              >
                Checkout
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}

export function Footer({ instagram = "@brikc.it" }: { instagram?: string }) {
  const handle = instagram.replace(/^@/, "")
  return (
    <footer className="relative overflow-hidden border-t border-white/10">
      <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#e63329]/20 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-5 py-20">
        <div className="grid gap-10 md:grid-cols-[1.8fr_1fr_1.3fr_1fr]">
          <div>
            <Logo className="h-11 w-auto" />
            <p className="mt-4 max-w-xs text-zinc-400">
              LEGO-style models &amp; LED display frames. Built, boxed, or framed to be seen.
            </p>
          </div>
          <div>
            <p className="ff-mono mb-4 text-[11px] tracking-widest text-zinc-500 uppercase">Shop</p>
            <ul className="space-y-2 text-zinc-400">
              {["F1", "Cars", "Bikes", "Collector"].map((c) => (
                <li key={c}>
                  <Link href={`/shop?cat=${c}`} className="hover:text-white">
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="ff-mono mb-4 text-[11px] tracking-widest text-zinc-500 uppercase">Legal</p>
            <ul className="space-y-2 text-zinc-400">
              {POLICIES.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className="hover:text-white">
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="ff-mono mb-4 text-[11px] tracking-widest text-zinc-500 uppercase">Follow</p>
            <a
              href={`https://instagram.com/${handle}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white"
            >
              <Instagram className="h-4 w-4" /> @{handle}
            </a>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="ff-mono text-[11px] tracking-widest text-zinc-500 uppercase">
            © {new Date().getFullYear()} brikc.it — Cars • Bikes • F1
          </p>
          <p className="ff-mono text-[11px] tracking-widest text-zinc-600 uppercase">
            Built, boxed &amp; framed in Pakistan
          </p>
        </div>
      </div>
    </footer>
  )
}
