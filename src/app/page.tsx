import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ComingSoon, Reveal, SectionHead, ExploreMore, ProductCard } from "../components/ui"
import { DisplayCard } from "../components/DisplayCard"
import { money } from "../lib/money"
import type { Product } from "../data"
import { getCategories, getDisplays, getGuides, getProducts } from "../lib/shop"
import { cardTag, fromPrice, productImage, subline } from "../lib/product-view"
import { STEPS } from "../content/site"
import type { Guide, StoreCategory } from "../data"
import { PRICE_BANDS } from "../data"


function Hero({ categories }: { categories: StoreCategory[] }) {
  return (
    <section className="relative isolate overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/hero.jpg"
        alt=""
        aria-hidden
        loading="lazy"
        style={{ backgroundColor: "#eceae7" }}
        className="absolute inset-0 h-full w-full object-cover brightness-[0.78]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(250,248,246,0.98)_0%,rgba(250,248,246,0.93)_42%,rgba(250,248,246,0.34)_72%,rgba(250,248,246,0.02)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_20%,rgba(211,31,46,0.09),transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[var(--background)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="max-w-xl" style={{ animation: "fade-up .6s ease both" }}>
          <h1
            className="font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl"
            style={{ fontWeight: 800 }}
          >
            Buy it <span className="text-[var(--primary)]">built</span><br />
            or build it yourself.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-[var(--foreground)]/80">
            Museum-grade scale builds of the cars, bikes and F1 machines you love — sealed in the
            box or assembled by hand, and an LED frame to put it in whenever you want one.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/shop"
              className="mat-btn sheen rounded-full bg-[var(--primary)] px-7 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-2)] hover:brightness-105 hover:shadow-[var(--shadow-3)]"
            >
              Shop the collection
            </Link>
            <Link
              href="/best-sellers"
              className="mat-btn rounded-full bg-white/80 px-7 py-3.5 text-sm font-semibold text-[var(--foreground)] backdrop-blur hover:bg-white"
            >
              Best sellers
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {/* Linked by slug, not name: renaming a category in the admin
                cascades to its builds but must not break a link in the wild. */}
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/shop?cat=${c.slug}`}
                className="mat-btn rounded-full border border-[var(--border)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--muted)] backdrop-blur hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                {c.name}
              </Link>
            ))}
          </div>

          {/* Price brackets, kept visibly apart from the categories above and
              labelled as what they are. They land on the same /shop grid with
              the filter already applied — a way of reading the catalogue, not
              another shelf in it. */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
              By price
            </span>
            {PRICE_BANDS.map((b) => (
              <Link
                key={b.id}
                href={`/shop?price=${b.id}`}
                className="mat-btn rounded-full px-3.5 py-1.5 text-sm font-medium text-[var(--muted)] underline decoration-[var(--border)] underline-offset-4 hover:text-[var(--primary)] hover:decoration-[var(--primary)]"
              >
                {b.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function BestSellers({ products }: { products: Product[] }) {
  const featured = products.filter((p) => p.featured).slice(0, 3)

  return (
    <section className="relative isolate overflow-hidden bg-[#0b0b0d] text-white">
      <div className="animated-gradient absolute inset-0 bg-[linear-gradient(120deg,#0b0b0d_0%,#1a0c11_35%,#2a0812_60%,#0b0b0d_100%)] opacity-90" />
      <div className="absolute -top-10 -left-24 h-72 w-72 rounded-full bg-[var(--primary)]/25 blur-3xl float-slow" />
      <div
        className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-[var(--primary-2)]/20 blur-3xl float-slow"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="mb-10">
            {/* Action on the title's line, matching SectionHead. */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <h2
                className="font-display text-4xl tracking-tight sm:text-5xl lg:text-6xl"
                style={{ fontWeight: 800 }}
              >
                Best Sellers
              </h2>
              <Link
                href="/best-sellers"
                className="mat-btn sheen inline-flex flex-none items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#0b0b0d] hover:bg-white/90"
              >
                Explore all best sellers
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-3 max-w-2xl text-lg text-white/60">
              The builds our collectors reach for most — fan-favourite frames, built to last.
            </p>
          </div>
        </Reveal>

        {featured.length === 0 ? (
          <ComingSoon onDark note="The first best sellers land as soon as the catalogue opens." />
        ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {featured.map((p, i) => {
            const tag = cardTag(p)
            return (
              <Reveal key={p.slug} delay={i * 90}>
                <Link
                  href={`/shop/${p.slug}`}
                  className="mat-btn sheen group block h-full overflow-hidden rounded-3xl bg-gradient-to-b from-white/[0.09] to-white/[0.02] p-px ring-1 ring-white/10 transition hover:-translate-y-1.5 hover:ring-[var(--primary-2)]/50"
                >
                  <div className="flex h-full flex-col overflow-hidden rounded-[calc(1.5rem-1px)] bg-[#121114]">
                    <div className="relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={productImage(p)}
                        alt={p.name}
                        loading="lazy"
                        style={{ backgroundColor: "var(--foreground)" }}
                        className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      {tag && (
                        <span className="absolute top-4 left-4 rounded-full bg-[linear-gradient(135deg,var(--primary),var(--primary-deep))] px-3 py-1 text-xs font-bold text-white shadow-lg">
                          {tag}
                        </span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#121114] to-transparent" />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-display text-lg" style={{ fontWeight: 700 }}>
                        {p.name}
                      </h3>
                      <p className="mt-1 text-sm text-white/50">{subline(p)}</p>
                      <div className="mt-auto flex items-center justify-between pt-4">
                        <span className="font-display text-xl" style={{ fontWeight: 800 }}>
                          <span className="text-sm font-normal text-white/50">from </span>
                          {money(fromPrice(p))}
                        </span>
                        <span className="text-sm font-semibold text-[var(--primary-2)] transition-transform group-hover:translate-x-1">
                          View →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </Reveal>
            )
          })}
        </div>
        )}
      </div>
    </section>
  )
}

function ShopPreview({ products }: { products: Product[] }) {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <SectionHead
            title="Shop"
            desc="Assembled or in the box, with an optional LED frame — a taste of the collection."
            action={<ExploreMore to="/shop" label="Explore the full shop" />}
          />
        </Reveal>
        {products.length === 0 ? (
          <ComingSoon note="The first builds are on their way." />
        ) : (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {products.slice(0, 4).map((p, i) => (
            <Reveal key={p.slug} delay={i * 80}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
        )}
      </div>
    </section>
  )
}

function DisplaysPreview({ displays }: { displays: Product[] }) {

  return (
    <section className="bg-[var(--surface-2)] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <SectionHead
            title="Displays"
            desc="Frames, desks and the rest of the range."
            action={<ExploreMore to="/displays" label="Explore all displays" />}
          />
        </Reveal>
        {displays.length === 0 ? (
          <ComingSoon note="The display range is being photographed and priced." />
        ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {displays.slice(0, 4).map((d, i) => (
            <Reveal key={d.slug} delay={i * 80}>
              <DisplayCard product={d} />
            </Reveal>
          ))}
        </div>
        )}
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <SectionHead
            title="How it works"
            desc="From a box of bricks to a framed centrepiece — here's how your model comes to life."
          />
        </Reveal>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 90}>
              <div className="relative h-full rounded-3xl border border-[var(--border)] bg-white p-7 shadow-[var(--shadow-1)]">
                <span
                  className="font-display text-5xl text-[var(--primary)]"
                  style={{ fontWeight: 800 }}
                >
                  {s.n}
                </span>
                <h3 className="font-display mt-2 text-xl" style={{ fontWeight: 700 }}>
                  {s.title}
                </h3>
                <p className="mt-2 text-[var(--muted)]">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * Real reviews, from the same table the admin edits.
 *
 * The prototype this design came from had no reviews section — its REVIEWS
 * export was dead code. Porting that faithfully would have left the shop owner
 * with a review screen whose contents appear nowhere, so the section stays.
 */
function BookletsPreview({ guides }: { guides: Guide[] }) {

  return (
    <section className="border-t border-[var(--border)] bg-[var(--surface-2)] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <SectionHead
            title="Booklet Guides"
            desc="Step-by-step build, framing and lighting guides for every model."
            action={<ExploreMore to="/booklets" label="Explore all guides" />}
          />
        </Reveal>
        {guides.length === 0 ? (
          <ComingSoon note="Build, framing and lighting guides are being written." />
        ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {guides.map((g, i) => (
            <Reveal key={g.slug} delay={i * 70}>
              <Link
                href={`/booklets/${g.slug}`}
                className="mat-btn flex items-center gap-4 rounded-3xl bg-white px-5 py-5 shadow-[var(--shadow-1)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)]"
              >
                <span className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-[var(--surface-2)] text-xl">
                  {g.icon}
                </span>
                <span className="flex-1">
                  <span className="font-display block text-lg" style={{ fontWeight: 700 }}>
                    {g.title}
                  </span>
                  <span className="text-sm text-[var(--muted)]">{g.pages}-page guide</span>
                </span>
                <ArrowRight className="h-5 w-5 flex-none text-[var(--muted)]" />
              </Link>
            </Reveal>
          ))}
        </div>
        )}
      </div>
    </section>
  )
}

export default async function Home() {
  // Independent reads — fire them together rather than in series.
  const [products, categories, displays, guides] = await Promise.all([
    getProducts(),
    getCategories(),
    getDisplays(),
    getGuides(),
  ])

  return (
    <>
      <Hero categories={categories} />
      <BestSellers products={products} />
      <ShopPreview products={products} />
      <DisplaysPreview displays={displays} />
      <HowItWorks />
      <BookletsPreview guides={guides} />
    </>
  )
}
