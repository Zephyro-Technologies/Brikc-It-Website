"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, MessageCircle, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react"
import { useCart } from "../cart"
import { money } from "../lib/money"
import { FORMAT_LABELS } from "../data"
import { BANNER, NAV } from "../content/site"

/**
 * The light, Material-leaning chrome every page sits inside: a dismissible
 * announcement bar, a sticky header that picks up elevation on scroll, the
 * cart slide-over and the footer. Nav and the banner share one component so
 * the root layout only has to mount one thing above `main`.
 */

// lucide-react ships no brand marks any more, so Instagram is hand-rolled —
// same glyph the old dark chrome used, just recoloured via currentColor.
function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function LogoMark({ className = "", onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={onDark ? "/brand/mark-light.webp" : "/brand/mark-dark.webp"}
      alt=""
      aria-hidden
      className={`w-auto object-contain ${className}`}
    />
  )
}

/**
 * The full lockup, mark over wordmark.
 *
 * Its wordmark is a metallic grey gradient, which is handsome at size and
 * illegible small — so the header pairs the mark with type instead, and this
 * is used where there is room for it to be read.
 */
function Logo({ className = "", onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={onDark ? "/brand/logo-light.webp" : "/brand/logo-dark.webp"}
      alt="brikc.it"
      className={`w-auto object-contain ${className}`}
    />
  )
}

function CartButton() {
  const { count, setOpen } = useCart()
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Open cart"
      className="mat-btn relative flex items-center gap-2 rounded-full bg-[var(--foreground)] px-4 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)]"
    >
      <ShoppingBag className="h-[18px] w-[18px]" />
      <span className="hidden sm:inline">Cart</span>
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-[var(--primary)] px-1.5 text-xs font-bold text-white ring-2 ring-white">
          {count}
        </span>
      )}
    </button>
  )
}

export function Nav() {
  const pathname = usePathname()
  const [bannerOpen, setBannerOpen] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to))

  return (
    <>
      {bannerOpen && (
        <div className="relative bg-[linear-gradient(90deg,var(--primary),var(--primary-deep))] text-white">
          {/* Wider gutters than the site's usual px-4 sm:px-6, and symmetric, so
              the centred text clears the absolutely-positioned close button at
              every width instead of running under it. */}
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-12 py-2.5 text-center text-sm font-medium sm:px-14">
            <span>{BANNER}</span>
            <button
              type="button"
              aria-label="Dismiss banner"
              onClick={() => setBannerOpen(false)}
              className="mat-btn absolute right-3 grid h-7 w-7 place-items-center rounded-full hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <header
        className={`sticky top-0 z-40 border-b transition-all ${
          scrolled
            ? "border-[var(--border)] bg-white/85 shadow-[var(--shadow-1)] backdrop-blur-md"
            : "border-transparent bg-[var(--background)]"
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="brikc.it — home">
            <LogoMark className="h-11" />
            <span className="font-display text-xl tracking-tight" style={{ fontWeight: 800 }}>
              brikc.it
            </span>
          </Link>

          <div className="mx-auto hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                href={n.to}
                className={`mat-btn rounded-full px-4 py-2 text-sm font-medium ${
                  isActive(n.to)
                    ? "bg-[var(--surface-2)] text-[var(--foreground)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </div>

          {/* No search in this app — a dead icon linking nowhere is worse than
              no icon, so the prototype's search button was dropped rather than
              ported. */}
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <CartButton />
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="mat-btn grid h-11 w-11 place-items-center rounded-full text-[var(--foreground)] hover:bg-[var(--surface-2)] lg:hidden"
            >
              {menuOpen ? <X className="h-[22px] w-[22px]" /> : <Menu className="h-[22px] w-[22px]" />}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className="border-t border-[var(--border)] bg-white px-4 py-2 lg:hidden">
            {NAV.map((n) => (
              <Link
                key={n.to}
                href={n.to}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-xl px-4 py-3 text-sm font-medium ${
                  isActive(n.to)
                    ? "bg-[var(--surface-2)] text-[var(--foreground)]"
                    : "text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </div>
        )}
      </header>
    </>
  )
}

export function CartDrawer() {
  const { lines, open, setOpen, subtotal, remove, setQty, count, clear } = useCart()

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-hidden={!open}
        className={`fixed top-0 right-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-[var(--shadow-3)] transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-display text-lg" style={{ fontWeight: 800 }}>
            Your cart {count > 0 && `(${count})`}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            className="mat-btn grid h-9 w-9 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="h-10 w-10 text-[var(--muted)]" />
            <p className="text-[var(--muted)]">Your cart is empty.</p>
            <Link
              href="/shop"
              onClick={() => setOpen(false)}
              className="mat-btn rounded-full bg-[var(--foreground)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black"
            >
              Browse builds
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {lines.map((l) => (
                <div
                  key={l.key}
                  className="flex gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={l.image}
                      alt={l.name}
                      loading="lazy"
                      style={{ backgroundColor: "#eceae7" }}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display truncate text-sm" style={{ fontWeight: 700 }}>
                          {l.name}
                        </p>
                        <p className="mt-0.5 text-xs font-bold tracking-wide text-[var(--primary)] uppercase">
                          {l.format ? FORMAT_LABELS[l.format] : l.variantLabel}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(l.key)}
                        aria-label={`Remove ${l.name}`}
                        className="mat-btn shrink-0 text-[var(--muted)] hover:text-[var(--primary)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-[var(--border)] bg-white">
                        <button
                          type="button"
                          onClick={() => setQty(l.key, l.qty - 1)}
                          aria-label="Decrease quantity"
                          className="mat-btn grid h-8 w-8 place-items-center text-[var(--muted)] hover:text-[var(--foreground)]"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{l.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(l.key, l.qty + 1)}
                          aria-label="Increase quantity"
                          className="mat-btn grid h-8 w-8 place-items-center text-[var(--muted)] hover:text-[var(--foreground)]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-display font-bold">{money(l.unitPrice * l.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={clear}
                className="mat-btn text-xs font-semibold tracking-wide text-[var(--muted)] uppercase hover:text-[var(--foreground)]"
              >
                Clear cart
              </button>
            </div>
            <div className="border-t border-[var(--border)] px-5 py-5">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[var(--muted)]">Subtotal</span>
                <span className="font-display text-xl font-extrabold">{money(subtotal)}</span>
              </div>
              <p className="mb-4 text-xs text-[var(--muted)]">Free delivery anywhere in Pakistan</p>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="mat-btn block w-full rounded-full bg-[var(--primary)] py-3.5 text-center text-sm font-bold text-white shadow-[var(--shadow-1)] hover:brightness-105 hover:shadow-[var(--shadow-2)]"
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  )
}

// Computed once when the module loads rather than inside the render body —
// the value only ever changes once a year, so a module-level constant can't
// disagree between a server render and the client hydrating it the way a
// call inside JSX could.
const YEAR = new Date().getFullYear()

export function Footer({ instagram = "@brikc.it" }: { instagram?: string }) {
  const handle = instagram.replace(/^@/, "")
  return (
    <footer className="border-t border-[var(--border)] bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2.5" aria-label="brikc.it — home">
            <Logo className="h-20" />
          </Link>
          <p className="mt-4 max-w-xs text-sm text-[var(--muted)]">
            Cars, bikes, F1 and collector builds — boxed, built, or mounted in an LED-lit frame.
          </p>
          <a
            href={`https://instagram.com/${handle}`}
            target="_blank"
            rel="noreferrer"
            className="mat-btn mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--surface-2)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--primary)] hover:text-white"
          >
            <InstagramIcon className="h-4 w-4" />@{handle}
          </a>
        </div>

        <div>
          <h4 className="text-sm font-bold tracking-wider text-[var(--muted)] uppercase">Explore</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link href={n.to} className="text-[var(--foreground)] hover:text-[var(--primary)]">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* The prototype's newsletter form posted nowhere — there is no
            mailing list here. Instagram is the one channel getSettings()
            actually gives the footer, so that's what this column offers. */}
        <div>
          <h4 className="text-sm font-bold tracking-wider text-[var(--muted)] uppercase">Get in touch</h4>
          <p className="mt-4 text-sm text-[var(--muted)]">Questions before you order? We reply fastest on Instagram.</p>
          <a
            href={`https://instagram.com/${handle}`}
            target="_blank"
            rel="noreferrer"
            className="mat-btn mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-black"
          >
            <MessageCircle className="h-4 w-4" />
            Message us
          </a>
        </div>
      </div>

      <div className="border-t border-[var(--border)] px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-xs whitespace-nowrap text-[var(--muted)]">© {YEAR} brikc.it — built by hand, framed with care.</p>
          {/* Kept from the previous chrome: the shop calls its models
              "LEGO-style" throughout, so saying plainly that the LEGO Group
              has nothing to do with us is what keeps that descriptive rather
              than a suggestion of endorsement. */}
          <p className="max-w-2xl text-xs leading-relaxed text-[var(--muted)]">
            LEGO&reg; is a trademark of the LEGO Group, which does not sponsor, authorise or endorse this
            site. brikc.it is not affiliated with the LEGO Group, nor with any vehicle manufacturer, racing
            team or championship whose car or livery a model may resemble — such names are used only to
            describe the subject of a build.
          </p>
        </div>
      </div>
    </footer>
  )
}
