import type { ReactNode } from "react"
import { Clock, Mail, MapPin, Phone } from "lucide-react"
import { Reveal } from "./ui"
import { BUSINESS, POLICIES_UPDATED, telHref } from "../content/business"

/**
 * The shared shape of the written pages — privacy, terms, refunds, shipping and
 * how-it-works — built from the same pieces as the rest of the site rather
 * than as a plain document: the Best Sellers band's drifting gradient behind
 * the title, the homepage's bordered cards that lift on hover, and a black
 * band to close on.
 *
 * All the motion is the stylesheet's existing classes (.animated-gradient,
 * .float-slow, .reveal), so prefers-reduced-motion switches it off in one
 * place, the same as everywhere else.
 */

export const policyLink =
  "font-medium text-[var(--primary)] underline decoration-[var(--primary)]/40 underline-offset-2 transition-colors hover:text-[var(--primary-deep)] hover:decoration-[var(--primary-deep)]"

/** The brand gradient, between the two reds white text clears AA on. */
const RED_GRADIENT = "bg-[linear-gradient(135deg,var(--primary),var(--primary-deep))]"

/** Best Sellers' backdrop: the slow-drifting dark gradient and two red glows. */
function DarkBackdrop() {
  return (
    <>
      <div className="animated-gradient absolute inset-0 bg-[linear-gradient(120deg,#0b0b0d_0%,#1a0c11_35%,#2a0812_60%,#0b0b0d_100%)] opacity-90" />
      <div className="float-slow absolute -top-10 -left-24 h-72 w-72 rounded-full bg-[var(--primary)]/25 blur-3xl" />
      <div
        className="float-slow absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-[var(--primary-2)]/20 blur-3xl"
        style={{ animationDelay: "1.5s" }}
      />
    </>
  )
}

export function PolicyPage({
  title,
  intro,
  updated = POLICIES_UPDATED,
  children,
}: {
  title: string
  intro?: string
  updated?: string
  children: ReactNode
}) {
  return (
    <>
      <header className="relative isolate overflow-hidden bg-[#0b0b0d] text-white">
        <DarkBackdrop />
        <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-16 sm:px-6">
          <Reveal>
            <h1 className="font-display text-4xl tracking-tight sm:text-5xl lg:text-6xl" style={{ fontWeight: 800 }}>
              {title}
            </h1>
            {intro && <p className="mt-4 max-w-2xl text-lg text-white/70">{intro}</p>}
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/70 backdrop-blur">
              <Clock className="h-3.5 w-3.5" />
              Updated {updated}
            </p>
          </Reveal>
        </div>
      </header>
      <article className="mx-auto max-w-7xl px-4 pt-10 pb-24 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-2">{children}</div>
      </article>
    </>
  )
}

/**
 * One card, in the homepage's card style — bordered, raised, lifting on hover
 * the way the booklet cards do, with a red rule under the title that stretches
 * as it lifts. `wide` spans both columns. `n` puts the homepage's big red step
 * numeral above the title, for a page that reads as a sequence of clauses.
 */
export function Section({
  title,
  wide = false,
  n,
  children,
}: {
  title: string
  wide?: boolean
  n?: number
  children: ReactNode
}) {
  return (
    <Reveal className={wide ? "lg:col-span-2" : ""}>
      <section className="group h-full rounded-3xl border border-[var(--border)] bg-white p-7 shadow-[var(--shadow-1)] transition duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/25 hover:shadow-[var(--shadow-2)]">
        {n !== undefined && (
          <span
            className={`font-display block origin-left bg-clip-text text-4xl text-transparent transition-transform duration-300 group-hover:scale-110 ${RED_GRADIENT}`}
            style={{ fontWeight: 800 }}
          >
            {String(n).padStart(2, "0")}
          </span>
        )}
        <h2 className={`font-display text-xl ${n !== undefined ? "mt-2" : ""}`} style={{ fontWeight: 700 }}>
          {title}
        </h2>
        <span
          className={`mt-3 block h-1 w-10 rounded-full transition-all duration-300 group-hover:w-20 ${RED_GRADIENT}`}
        />
        <div className="mt-4 space-y-3 text-[var(--muted)]">{children}</div>
      </section>
    </Reveal>
  )
}

/**
 * The page's headline facts, before the detail — the homepage's how-it-works
 * cards, with a figure where those have a step number. A red glow comes up in
 * the corner as the card lifts.
 */
export function Highlights({ items }: { items: { figure: string; title: string; body: string }[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-3 lg:col-span-2">
      {items.map((x, i) => (
        <Reveal key={x.title} delay={i * 90}>
          <div className="group relative h-full overflow-hidden rounded-3xl border border-[var(--border)] bg-white p-7 shadow-[var(--shadow-1)] transition duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/25 hover:shadow-[var(--shadow-3)]">
            <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-[var(--primary)]/15 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
            <span
              className={`font-display relative inline-block origin-left bg-clip-text text-5xl text-transparent transition-transform duration-300 group-hover:scale-105 ${RED_GRADIENT}`}
              style={{ fontWeight: 800 }}
            >
              {x.figure}
            </span>
            <h3 className="font-display relative mt-2 text-xl" style={{ fontWeight: 700 }}>
              {x.title}
            </h3>
            <p className="relative mt-2 text-[var(--muted)]">{x.body}</p>
          </div>
        </Reveal>
      ))}
    </div>
  )
}

/**
 * Numbered steps, badged the way the booklet chapters are; the badge tips and
 * grows on hover. Each step sits on its own tile so a long run of them reads as
 * separate stops rather than one block of text.
 */
export function Steps({
  steps,
  columns = 3,
}: {
  steps: { title: string; body: ReactNode }[]
  /** Across a wide card on a large screen. Literal classes, so Tailwind can see them. */
  columns?: 3 | 4
}) {
  const lg = columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
  return (
    <ol className={`mt-2 grid gap-4 sm:grid-cols-2 ${lg}`}>
      {steps.map((step, i) => (
        <li
          key={step.title}
          className="group/step flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5 transition duration-300 hover:border-[var(--primary)]/25 hover:bg-white hover:shadow-[var(--shadow-1)]"
        >
          <span
            className={`font-display grid h-11 w-11 flex-none place-items-center rounded-2xl text-white shadow-[var(--shadow-1)] transition duration-300 group-hover/step:-rotate-6 group-hover/step:scale-110 group-hover/step:shadow-[var(--shadow-2)] ${RED_GRADIENT}`}
            style={{ fontWeight: 700 }}
          >
            {i + 1}
          </span>
          <div>
            <p
              className="font-display text-[var(--foreground)] transition-colors group-hover/step:text-[var(--primary)]"
              style={{ fontWeight: 700 }}
            >
              {step.title}
            </p>
            <p className="mt-1">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

/**
 * The closing band: how to reach us, on the same drifting dark backdrop as the
 * title. Email and phone appear once they are confirmed in `BUSINESS`;
 * Instagram is always there — it is the one channel the shop has had from the
 * start.
 */
export function ContactBand({
  instagram,
  title = "Still have a question?",
  note = "Quote your order number if you have one, and we'll sort it out.",
}: {
  instagram: string
  title?: string
  note?: string
}) {
  const handle = instagram.replace(/^@/, "")
  const pill =
    "mat-btn inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)]"
  return (
    <Reveal className="lg:col-span-2">
      <div className="relative isolate overflow-hidden rounded-3xl bg-[#0b0b0d] p-7 text-white shadow-[var(--shadow-2)] sm:p-9">
        <DarkBackdrop />
        <div className="relative">
          <h2 className="font-display text-2xl" style={{ fontWeight: 700 }}>
            {title}
          </h2>
          <p className="mt-1 text-white/70">{note}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {BUSINESS.email && (
              <a
                href={`mailto:${BUSINESS.email}`}
                className={`${pill} bg-white text-[var(--foreground)] hover:bg-white/90`}
              >
                <Mail className="h-4 w-4" />
                {BUSINESS.email}
              </a>
            )}
            {BUSINESS.phone && (
              <a href={telHref(BUSINESS.phone)} className={`${pill} bg-white/10 text-white hover:bg-white/20`}>
                <Phone className="h-4 w-4" />
                {BUSINESS.phone}
              </a>
            )}
            {handle && (
              <a
                href={`https://instagram.com/${handle}`}
                target="_blank"
                rel="noreferrer"
                className={`${pill} text-white hover:brightness-110 ${RED_GRADIENT}`}
              >
                Message @{handle} on Instagram
              </a>
            )}
          </div>
          {BUSINESS.address && (
            <p className="mt-6 flex gap-2 text-sm text-white/60">
              <MapPin className="mt-0.5 h-4 w-4 flex-none" />
              {BUSINESS.address}
            </p>
          )}
        </div>
      </div>
    </Reveal>
  )
}
