import type { ReactNode } from "react"
import Link from "next/link"
import { BUSINESS, POLICIES, businessDetailsComplete } from "../lib/legal"

export function LegalPage({
  title,
  summary,
  current,
  children,
}: {
  title: string
  /** One plain-English line under the heading. Not a substitute for the terms. */
  summary: string
  /** href of this page, so it isn't linked to itself in the footer nav. */
  current: string
  children: ReactNode
}) {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-28 pb-24 md:pt-36">
      {!businessDetailsComplete && (
        <p className="mb-10 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          <strong className="ff-display font-bold">Not ready to publish.</strong> The business
          details in <code className="ff-mono text-amber-100">src/lib/legal.ts</code> still contain
          placeholders. Fill them in before submitting this site for payment verification — this
          notice disappears on its own once they are all replaced.
        </p>
      )}

      <p className="ff-mono text-[11px] tracking-widest text-[#ff6b4a] uppercase">Legal</p>
      <h1 className="ff-display mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">{title}</h1>
      <p className="mt-4 text-lg text-zinc-400">{summary}</p>
      <p className="ff-mono mt-6 border-t border-white/10 pt-6 text-[11px] tracking-widest text-zinc-500 uppercase">
        Last updated {BUSINESS.lastUpdated}
      </p>

      <div className="mt-12 space-y-10">{children}</div>

      <div className="mt-16 border-t border-white/10 pt-8">
        <p className="ff-mono mb-4 text-[11px] tracking-widest text-zinc-500 uppercase">
          Other policies
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {POLICIES.filter((p) => p.href !== current).map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="text-zinc-400 underline-offset-4 hover:text-white hover:underline">
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** A numbered clause, so support can point a customer at "section 4". */
export function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  const id = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="ff-display text-xl font-extrabold tracking-tight">
        <span className="ff-mono mr-3 text-sm font-normal text-zinc-600">
          {String(n).padStart(2, "0")}
        </span>
        {title}
      </h2>
      <div className="mt-4 space-y-4 leading-relaxed text-zinc-400">{children}</div>
    </section>
  )
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="list-outside list-disc space-y-2 pl-5 marker:text-zinc-600">{children}</ul>
}

/** Key/value rows — used for the contact and ownership details. */
export function Details({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-[#101012]">
      {rows.map(([k, v]) => (
        <div key={k} className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
          <dt className="ff-mono text-[11px] tracking-widest text-zinc-500 uppercase sm:pt-0.5">
            {k}
          </dt>
          <dd className="text-zinc-300">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export function MailLink() {
  return (
    <a href={`mailto:${BUSINESS.email}`} className="text-[#ff6b4a] underline-offset-4 hover:underline">
      {BUSINESS.email}
    </a>
  )
}
