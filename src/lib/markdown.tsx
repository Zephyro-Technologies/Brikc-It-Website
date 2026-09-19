import { Fragment, type ReactNode } from "react"

/**
 * A very small Markdown renderer — enough for a product description and no more.
 *
 * Paragraphs, headings, bullet and numbered lists, bold, italic, links and
 * images. No tables, no code blocks, and deliberately no raw HTML: the input is
 * typed by a shop owner, not a developer, and everything it can express is
 * something this file chose to support.
 *
 * On safety. React escapes text nodes, so nothing typed into the description can
 * become markup by itself. It does NOT escape `href` and `src`, though — a link
 * written as `javascript:...` would run if handed straight to an anchor. Every
 * URL therefore goes through safeUrl() below, and anything that isn't plainly
 * http, https or mailto is dropped. That is the one genuinely dangerous corner
 * of rendering somebody's text, and it is closed here rather than trusted to the
 * form that collected it.
 *
 * Written by hand rather than pulled in: a Markdown library is a large amount of
 * code, most of it for syntax nobody here types, and every line of it would run
 * against text from the admin.
 */

/** http(s) and mailto only. Anything else — javascript:, data:, vbscript: — is refused. */
function safeUrl(raw: string): string | null {
  const url = raw.trim()
  // A bare path or fragment can't carry a scheme, so it needs no scheme check —
  // but "//host/x" is NOT a path. The browser reads it as protocol-relative and
  // fetches it from that host, so it has to go through the scheme check below
  // like any other address, where it fails and is dropped.
  if ((url.startsWith("/") && !url.startsWith("//")) || url.startsWith("#")) return url
  if (/^https?:\/\//i.test(url) || /^mailto:/i.test(url)) return url
  return null
}

/** Bold, italic, links and images, applied inside a line of text. */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = []
  // One pass over the four inline forms, longest-delimiter first so that ** is
  // never mistaken for two separate italics.
  const pattern = /(!?)\[([^\]]*)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_/g

  let last = 0
  let match: RegExpExecArray | null
  let i = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index))
    const key = `${keyPrefix}-${i++}`

    if (match[3] !== undefined) {
      const href = safeUrl(match[3])
      const label = match[2] || match[3]
      if (!href) {
        // Refused link: keep the words, drop the address. Silently removing the
        // text would make it look like the description lost a sentence.
        out.push(label)
      } else if (match[1] === "!") {
        out.push(
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={key}
            src={href}
            alt={label}
            loading="lazy"
            className="my-4 w-full rounded-2xl shadow-[var(--shadow-1)]"
          />,
        )
      } else {
        out.push(
          <a
            key={key}
            href={href}
            className="font-medium text-[var(--primary)] underline underline-offset-2"
            {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {label}
          </a>,
        )
      }
    } else if (match[4] !== undefined) {
      out.push(<strong key={key}>{match[4]}</strong>)
    } else {
      out.push(<em key={key}>{match[5] ?? match[6]}</em>)
    }
    last = pattern.lastIndex
  }

  if (last < text.length) out.push(text.slice(last))
  return out
}

/**
 * Renders Markdown as elements.
 *
 * Blocks are split on blank lines, which is also why this is worth doing at all
 * for the descriptions already in the database: they carry line breaks that HTML
 * has been collapsing into one long paragraph.
 */
export function Markdown({ text, className = "" }: { text: string; className?: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/)

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {blocks.map((block, b) => {
        const lines = block.split("\n").filter((l) => l.trim() !== "")
        if (lines.length === 0) return null

        const heading = lines[0].match(/^(#{1,3})\s+(.*)$/)
        if (heading && lines.length === 1) {
          const level = heading[1].length
          const size = level === 1 ? "text-2xl" : level === 2 ? "text-xl" : "text-lg"
          return (
            <h3 key={b} className={`font-display ${size} text-[var(--foreground)]`} style={{ fontWeight: 700 }}>
              {inline(heading[2], `h${b}`)}
            </h3>
          )
        }

        const bulleted = lines.every((l) => /^\s*[-*+]\s+/.test(l))
        if (bulleted) {
          return (
            <ul key={b} className="flex list-disc flex-col gap-1.5 pl-5 marker:text-[var(--primary)]">
              {lines.map((l, i) => (
                <li key={i}>{inline(l.replace(/^\s*[-*+]\s+/, ""), `u${b}-${i}`)}</li>
              ))}
            </ul>
          )
        }

        const numbered = lines.every((l) => /^\s*\d+[.)]\s+/.test(l))
        if (numbered) {
          return (
            <ol key={b} className="flex list-decimal flex-col gap-1.5 pl-5 marker:text-[var(--primary)]">
              {lines.map((l, i) => (
                <li key={i}>{inline(l.replace(/^\s*\d+[.)]\s+/, ""), `o${b}-${i}`)}</li>
              ))}
            </ol>
          )
        }

        // A plain paragraph. Single newlines inside it stay as line breaks —
        // somebody who pressed Return once meant something by it.
        return (
          <p key={b}>
            {lines.map((l, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {inline(l, `p${b}-${i}`)}
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
