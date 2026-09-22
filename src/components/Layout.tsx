"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, MessageCircle, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react"
import { lineLabel, useCart } from "../cart"
import { money } from "../lib/money"
import { NAV } from "../content/site"

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

/**
 * The wide lockup — mark beside wordmark. The header's logo.
 *
 * It carries its own name, so nothing is typed beside it. An earlier version of
 * this header set the mark next to text in the page font, which meant the site
 * showed a wordmark the brand doesn't have.
 */
function Logo({ className = "" }: { className?: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/brand/logo.webp"
      alt="brikc.it"
      className={`w-auto object-contain ${className}`}
    />
  )
}

/**
 * The stacked lockup — mark above wordmark. The footer's, where it has room.
 *
 * There is one file per lockup, not a pair for light and dark. Both are drawn
 * in metal on nothing, and the one thing that would need a second version —
 * this one's wordmark is white — is the reason the footer is dark to begin with.
 */
function LogoStacked({ className = "" }: { className?: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/brand/logo-stacked.webp"
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
      className="mat-btn relative flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-1)] hover:bg-[var(--primary-deep)]"
    >
      <ShoppingBag className="h-[18px] w-[18px]" />
      <span className="hidden sm:inline">Cart</span>
      {/* The count inverts, because red on red is not a badge. */}
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-white px-1.5 text-xs font-bold text-[var(--primary-deep)] ring-2 ring-[#0b0b0d]">
          {count}
        </span>
      )}
    </button>
  )
}

export function Nav({ banner = "" }: { banner?: string }) {
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

  // Matches on the path alone. A shortcut carries a query string, which
  // usePathname() never sees, and reading it with useSearchParams() here would
  // opt every prerendered page in the site into dynamic rendering for the sake
  // of one highlight — so shortcuts simply never claim to be the current page.
  const isActive = (item: { to: string; shortcut?: boolean }) =>
    item.shortcut ? false : item.to === "/" ? pathname === "/" : pathname.startsWith(item.to)

  return (
    <>
      {/* Empty is how the admin turns the bar off, so there is nothing to
          dismiss and nothing to lay out — not an empty red strip. */}
      {banner !== "" && bannerOpen && (
        <div className="relative bg-[linear-gradient(90deg,var(--primary),var(--primary-deep))] text-white">
          {/* Wider gutters than the site's usual px-4 sm:px-6, and symmetric, so
              the centred text clears the absolutely-positioned close button at
              every width instead of running under it. */}
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-12 py-2.5 text-center text-sm font-medium sm:px-14">
            <span>{banner}</span>
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

      {/* Dark, the same #0b0b0d the footer and the Best Sellers band use. The
          lockup's wordmark is a pale metal drawn for exactly this — on the
          light background it sat at 2:1. Scrolled, it goes translucent and
          blurs so the page moves underneath it rather than behind a slab. */}
      <header
        className={`sticky top-0 z-40 border-b transition-all ${
          scrolled
            ? "border-white/10 bg-[#0b0b0d]/90 shadow-[var(--shadow-2)] backdrop-blur-md"
            : "border-transparent bg-[#0b0b0d]"
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center" aria-label="brikc.it — home">
            <Logo className="h-12" />
          </Link>

          <div className="mx-auto hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                href={n.to}
                className={`mat-btn rounded-full px-4 py-2 text-sm font-medium ${
                  isActive(n)
                    ? "bg-white/10 text-white"
                    : n.shortcut
                      ? // A price shortcut is an offer, not a section, so it is
                        // the one nav item that carries colour. Tinted rather
                        // than filled — the Cart is the only solid red in the
                        // header and there is no point having two of those.
                        "bg-[var(--primary)]/12 text-[var(--primary-2)] ring-1 ring-[var(--primary)]/40 hover:bg-[var(--primary)]/20 hover:text-white"
                      : "text-white/65 hover:bg-white/10 hover:text-white"
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
              className="mat-btn grid h-11 w-11 place-items-center rounded-full text-white hover:bg-white/10 lg:hidden"
            >
              {menuOpen ? <X className="h-[22px] w-[22px]" /> : <Menu className="h-[22px] w-[22px]" />}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className="border-t border-white/10 bg-[#0b0b0d] px-4 py-2 lg:hidden">
            {NAV.map((n) => (
              <Link
                key={n.to}
                href={n.to}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-xl px-4 py-3 text-sm font-medium ${
                  isActive(n)
                    ? "bg-white/10 text-white"
                    : n.shortcut
                      ? "bg-[var(--primary)]/12 text-[var(--primary-2)] ring-1 ring-[var(--primary)]/40"
                      : "text-white/80 hover:bg-white/10"
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
                          {lineLabel(l)}
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
    /* Dark, like the Best Sellers band — the same two literals, not tokens,
       because this is a deliberate inversion rather than a surface the theme
       decides. The logo's wordmark is a pale metal drawn to sit on dark: at
       1.4:1 against the light background it could not be read at all, and at
       12.9:1 here it is what it was made to be. */
    <footer className="bg-[#0b0b0d] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex" aria-label="brikc.it — home">
            <LogoStacked className="h-28" />
          </Link>
          <p className="mt-4 max-w-xs text-sm text-white/60">
            Cars, bikes, F1 and collector builds — boxed, built, or mounted in a display frame.
          </p>
          <a
            href={`https://instagram.com/${handle}`}
            target="_blank"
            rel="noreferrer"
            className="mat-btn mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary)]"
          >
            <InstagramIcon className="h-4 w-4" />@{handle}
          </a>
        </div>

        <div>
          <h4 className="text-sm font-bold tracking-wider text-white/50 uppercase">Explore</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link href={n.to} className="text-white/85 hover:text-[var(--primary-2)]">
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
          <h4 className="text-sm font-bold tracking-wider text-white/50 uppercase">Get in touch</h4>
          <p className="mt-4 text-sm text-white/60">Questions before you order? We reply fastest on Instagram.</p>
          <a
            href={`https://instagram.com/${handle}`}
            target="_blank"
            rel="noreferrer"
            className="mat-btn mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110"
          >
            <MessageCircle className="h-4 w-4" />
            Message us
          </a>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-xs whitespace-nowrap text-white/45">© {YEAR} brikc.it — built by hand, framed with care.</p>
          {/* Kept from the previous chrome: the shop calls its models
              "LEGO-style" throughout, so saying plainly that the LEGO Group
              has nothing to do with us is what keeps that descriptive rather
              than a suggestion of endorsement. */}
          <p className="max-w-2xl text-xs leading-relaxed text-white/45">
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
