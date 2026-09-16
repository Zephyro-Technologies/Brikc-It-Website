import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getProducts, getSettings } from "../../lib/shop"
import { Reveal } from "../../components/ui"
import { cardTag, fromPrice, soldFormats, subline } from "../../lib/product-view"
import { money } from "../../lib/money"
import { FORMAT_LABELS } from "../../data"

export const metadata: Metadata = {
  title: "Best sellers — brikc.it",
  description: "The builds our collectors reach for most, boxed, built or framed with LED.",
}

// The one dark band in an otherwise light storefront — reserved for this page.
export default async function BestSellersPage() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()])
  const featured = products.filter((p) => p.featured)

  // Every format sold across the featured lineup, boxed-built-framed order.
  const formatsOnOffer = Array.from(new Set(featured.flatMap((p) => soldFormats(p)))).map(
    (f) => FORMAT_LABELS[f],
  )

  return (
    <div className="relative isolate overflow-hidden bg-[#0b0b0d] text-white">
      <div className="animated-gradient absolute inset-0 bg-[linear-gradient(125deg,#0b0b0d_0%,#180d0e_30%,#2c0d08_55%,#140a0b_78%,#0b0b0d_100%)]" />
      <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-[var(--primary)]/25 blur-3xl float-slow" />
      <div
        className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-[var(--primary-2)]/20 blur-3xl float-slow"
        style={{ animationDelay: "2s" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_-10%,rgba(255,107,44,0.16),transparent)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <header className="py-20 text-center sm:py-28">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-[var(--primary-2)]">
              ✦ Most loved
            </span>
            <h1
              className="font-display mx-auto mt-6 max-w-3xl text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl"
              style={{ fontWeight: 800 }}
            >
              Best{" "}
              <span className="bg-[linear-gradient(120deg,#ff6b2c,#e23a2e)] bg-clip-text text-transparent">
                Sellers
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/60">
              The builds our collectors reach for most — fan-favourite frames, ready to box, build
              by hand, or mount lit on your wall.
            </p>

            {featured.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/60">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--primary-2)] pulse-ring" />
                  {featured.length} best seller{featured.length === 1 ? "" : "s"}
                </span>
                {formatsOnOffer.length > 0 && (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[var(--primary-2)]" />
                    {formatsOnOffer.join(" · ")}
                  </span>
                )}
                {settings.leadTimes.standard && (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[var(--primary-2)]" />
                    Ships in {settings.leadTimes.standard}
                  </span>
                )}
              </div>
            )}
          </Reveal>
        </header>

        {featured.length === 0 ? (
          <Reveal>
            <div className="mb-24 rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
              <h2 className="font-display text-2xl" style={{ fontWeight: 700 }}>
                Nothing's marked as a best seller yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-white/60">
                Check back soon, or browse the full range while the lineup fills in.
              </p>
              <Link
                href="/shop"
                className="mat-btn mt-6 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#ff6b2c,#e23a2e)] px-7 py-3.5 text-sm font-semibold text-white hover:brightness-105"
              >
                Shop all models
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        ) : (
          <>
            <div className="grid gap-7 pb-24 md:grid-cols-3">
              {featured.map((p, i) => {
                const tag = cardTag(p)
                return (
                  <Reveal key={p.slug} delay={i * 100}>
                    <Link
                      href={`/shop/${p.slug}`}
                      className="mat-btn sheen group block h-full overflow-hidden rounded-[26px] bg-gradient-to-b from-white/[0.1] to-white/[0.02] p-px ring-1 ring-white/10 transition hover:-translate-y-2 hover:ring-[var(--primary-2)]/60 hover:shadow-[0_30px_60px_-15px_rgba(226,58,46,0.4)]"
                    >
                      <div className="flex h-full flex-col overflow-hidden rounded-[25px] bg-[#121114]">
                        <div className="relative overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            loading="lazy"
                            style={{ backgroundColor: "#eceae7" }}
                            className="h-64 w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#121114] to-transparent" />
                          {tag && (
                            <span className="absolute left-4 top-4 rounded-full bg-[linear-gradient(135deg,#ff6b2c,#e23a2e)] px-3.5 py-1.5 text-xs font-bold text-white shadow-lg">
                              {tag}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col p-6">
                          <h3 className="font-display text-xl" style={{ fontWeight: 700 }}>
                            {p.name}
                          </h3>
                          <p className="mt-1.5 text-sm text-white/50">{subline(p)}</p>
                          <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-5">
                            <span className="font-display text-2xl" style={{ fontWeight: 800 }}>
                              <span className="text-sm font-normal text-white/50">from </span>
                              {money(fromPrice(p))}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0b0b0d] transition group-hover:gap-2.5">
                              View
                              <ArrowRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                )
              })}
            </div>

            <Reveal>
              <div className="mb-24 flex flex-col items-center justify-between gap-5 rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center sm:flex-row sm:text-left">
                <div>
                  <h2 className="font-display text-2xl" style={{ fontWeight: 700 }}>
                    Can't decide? Browse the full range.
                  </h2>
                  <p className="mt-1 text-white/60">
                    Cars, bikes, F1 and collector builds — filter to find your next centrepiece.
                  </p>
                </div>
                <Link
                  href="/shop"
                  className="mat-btn flex-none rounded-full bg-[linear-gradient(135deg,#ff6b2c,#e23a2e)] px-7 py-3.5 text-sm font-semibold text-white hover:brightness-105"
                >
                  Shop all models
                </Link>
              </div>
            </Reveal>
          </>
        )}
      </div>
    </div>
  )
}
