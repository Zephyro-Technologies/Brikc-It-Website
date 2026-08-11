import Link from "next/link"
import { Package, Boxes, Frame, Truck, ShieldCheck, Sparkles } from "lucide-react"
import { FORMATS, STEPS, type Product, type Review, type StoreCategory } from "../data"
import { getCategories, getFaqs, getProducts, getReviews } from "../lib/shop"
import { ProductCard } from "../components/ProductCard"
import { Faq } from "../components/Faq"

function Marquee() {
  const items = ["CARS", "BIKES", "F1", "COLLECTOR SETS", "BUILT", "BOXED", "FRAMED"]
  const run = [...items, ...items]
  return (
    <div className="overflow-hidden border-y border-white/10 bg-[#0d0d0f] py-4">
      <div className="animate-marquee flex w-max gap-10 whitespace-nowrap">
        {run.map((it, i) => (
          <span key={i} className="ff-mono flex items-center gap-10 text-sm tracking-[0.25em] text-zinc-500">
            {it}
            <span className="text-[#e63329]">◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// Editorial art direction for the hero, not catalogue data — stays in code.
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1614949194403-9602bdc14a3a?w=1600&h=1000&fit=crop&auto=format"

function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 md:pt-40 md:pb-32">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url(${HERO_IMAGE})`, backgroundColor: "#111" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#09090a] via-[#09090a]/80 to-[#09090a]/40" />
      <div className="absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-[#e63329]/25 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-5">
        <p className="ff-mono mb-6 flex items-center gap-3 text-xs tracking-[0.35em] text-[#ff6b4a] uppercase">
          <span className="h-2 w-2 animate-flicker rounded-full bg-[#e63329]" />
          LEGO-style models &amp; display frames
        </p>
        <h1 className="ff-display max-w-4xl text-5xl leading-[0.95] font-black tracking-tight sm:text-6xl md:text-8xl">
          Your favorite builds.
          <br />
          <span className="text-[#e63329]">Framed</span> to be seen.
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-zinc-300">
          Cars, bikes, F1 and collector sets — built, boxed, or mounted in LED-lit display frames.
          Made to sit on your wall, not in a drawer.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link
            href="/shop"
            className="rounded-full bg-[#e63329] px-7 py-3.5 ff-display font-bold text-white transition-transform hover:scale-105 led-glow-soft"
          >
            Shop all builds
          </Link>
          <Link
            href="/shop?cat=F1"
            className="rounded-full border border-white/20 px-7 py-3.5 ff-display font-semibold text-white transition-colors hover:bg-white/5"
          >
            Browse F1
          </Link>
        </div>
        <dl className="mt-16 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-8">
          {[
            ["30+", "Builds delivered"],
            ["1:8", "Flagship scale"],
            ["3", "Ways to own it"],
          ].map(([n, l]) => (
            <div key={l}>
              <dt className="ff-display text-3xl font-extrabold">{n}</dt>
              <dd className="ff-mono mt-1 text-[11px] tracking-widest text-zinc-500 uppercase">{l}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

const FORMAT_ICONS = [Package, Boxes, Frame]

function Formats() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="ff-mono mb-3 text-xs tracking-[0.3em] text-[#ff6b4a] uppercase">Three ways to own it</p>
          <h2 className="ff-display text-4xl font-extrabold tracking-tight md:text-5xl">Built. Boxed. Framed.</h2>
        </div>
        <p className="max-w-sm text-zinc-400">Choose the format per item at checkout — most builds offer all three.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {FORMATS.map((f, i) => {
          const Icon = FORMAT_ICONS[i]
          return (
            <div
              key={f.title}
              className={`group relative flex flex-col rounded-2xl border p-8 transition-transform hover:-translate-y-1 ${
                f.highlight ? "border-[#e63329]/40 bg-[#140b0a] led-glow" : "border-white/10 bg-[#101012]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="ff-mono text-xs tracking-widest text-zinc-500">{f.tag}</span>
                <Icon className={`h-5 w-5 ${f.highlight ? "text-[#ff6b4a]" : "text-zinc-500"}`} />
              </div>
              <h3 className="ff-display mt-4 text-2xl font-extrabold">{f.title}</h3>
              <p className="mt-3 leading-relaxed text-zinc-400">{f.copy}</p>
              {f.highlight && (
                <span className="ff-mono mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-[#e63329]/15 px-3 py-1 text-[11px] tracking-widest text-[#ff6b4a] uppercase">
                  Most popular
                </span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Categories({ categories }: { categories: StoreCategory[] }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-12">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((c) => (
          <Link
            key={c.name}
            href={`/shop?cat=${c.name}`}
            className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.image}
              alt={`${c.name} builds`}
              className="h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h3 className="ff-display text-2xl font-extrabold">{c.name}</h3>
              <p className="ff-mono text-[11px] tracking-widest text-zinc-400 uppercase">{c.blurb}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function Featured({ products }: { products: Product[] }) {
  const featured = products.filter((p) => p.featured).slice(0, 4)
  return (
    <section className="mx-auto max-w-7xl px-5 py-24">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="ff-mono mb-3 text-xs tracking-[0.3em] text-[#ff6b4a] uppercase">Featured builds</p>
          <h2 className="ff-display text-4xl font-extrabold tracking-tight md:text-5xl">On the wall</h2>
        </div>
        <Link href="/shop" className="ff-mono text-xs tracking-widest text-zinc-300 uppercase hover:text-white">
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  )
}

const PROMISE = [
  { icon: Truck, t: "Shipped safe", d: "Double-boxed with custom foam. Framed builds ship in reinforced crates." },
  { icon: ShieldCheck, t: "Inspected builds", d: "Every assembled model is checked brick-by-brick before it leaves." },
  { icon: Sparkles, t: "Integrated LED", d: "Framed editions include a discreet, dimmable LED strip and power lead." },
]

// Named Promises, not Promise: a component called Promise would shadow the
// global and break Promise.all in this module.
function Promises() {
  return (
    <section className="border-y border-white/10 bg-[#0d0d0f]">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 md:grid-cols-3">
        {PROMISE.map((p) => (
          <div key={p.t} className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e63329]/30 bg-[#e63329]/10 text-[#ff6b4a]">
              <p.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="ff-display text-lg font-bold">{p.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{p.d}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function How() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24">
      <p className="ff-mono mb-3 text-xs tracking-[0.3em] text-[#ff6b4a] uppercase">How it works</p>
      <h2 className="ff-display mb-14 text-4xl font-extrabold tracking-tight md:text-5xl">From set to statement piece</h2>
      <div className="grid gap-8 md:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.n} className="relative border-t border-white/15 pt-6">
            <span className="ff-display absolute -top-1 right-0 text-6xl font-black text-white/5">{s.n}</span>
            <h3 className="ff-display text-2xl font-extrabold">{s.t}</h3>
            <p className="mt-3 max-w-xs leading-relaxed text-zinc-400">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Reviews({ reviews }: { reviews: Review[] }) {
  return (
    <section className="border-y border-white/10 bg-[#0d0d0f]">
      <div className="mx-auto max-w-7xl px-5 py-24">
        <p className="ff-mono mb-3 text-xs tracking-[0.3em] text-[#ff6b4a] uppercase">From the community</p>
        <h2 className="ff-display mb-12 text-4xl font-extrabold tracking-tight md:text-5xl">Built to be shown off</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.handle} className="flex flex-col rounded-2xl border border-white/10 bg-[#101012] p-6">
              <div className="ff-mono mb-4 text-[#ff6b4a]">★★★★★</div>
              <blockquote className="flex-1 leading-relaxed text-zinc-200">“{r.text}”</blockquote>
              <figcaption className="mt-6 border-t border-white/10 pt-4">
                <p className="ff-display font-bold">{r.name}</p>
                <p className="ff-mono text-[11px] tracking-widest text-zinc-500 uppercase">
                  {r.handle} · {r.build}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaBand() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#e63329]/20 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-5 py-24 text-center">
        <h2 className="ff-display mx-auto max-w-2xl text-4xl font-black tracking-tight md:text-6xl">
          Ready to frame yours?
        </h2>
        <p className="mx-auto mt-5 max-w-md text-zinc-400">
          Pick a build, choose built, boxed, or framed, and add it to your cart.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-block rounded-full bg-[#e63329] px-8 py-4 ff-display font-bold text-white transition-transform hover:scale-105 led-glow-soft"
        >
          Shop the collection
        </Link>
      </div>
    </section>
  )
}

export default async function Home() {
  // Four independent reads — fire them together rather than in series.
  const [products, categories, reviews, faqs] = await Promise.all([
    getProducts(),
    getCategories(),
    getReviews(),
    getFaqs(),
  ])

  return (
    <>
      <Hero />
      <Marquee />
      <Formats />
      <Categories categories={categories} />
      <Featured products={products} />
      <Promises />
      <How />
      <Reviews reviews={reviews} />
      <Faq items={faqs} />
      <CtaBand />
    </>
  )
}
