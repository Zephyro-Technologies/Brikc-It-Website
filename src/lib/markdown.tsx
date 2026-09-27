import { Fragment, type ReactNode } from "react"

/**
 * A small Markdown renderer — enough for a product description and no more.
 *
 * Paragraphs, headings, bullet and numbered lists, horizontal rules, bold,
 * italic, links and images. No tables, no code, and deliberately no raw HTML:
 * the input is typed by a shop owner, not a developer, and everything it can
 * express is something this file chose to support.
 *
 * Line by line, the way Markdown is actually read: a heading or a list can start
 * on the line straight after a paragraph or an image, with no blank line before
 * it. The first version split the text on blank lines and only recognised a
 * heading that stood alone in its chunk, so "## Size & specs" followed by its
 * list on the next line came out as the literal characters.
 *
 * It also mends what the admin's Bold and Italic buttons used to write. They
 * wrapped the selection as it stood, and a line selected by triple-click brings
 * its line break with it — "**Headline\n**" — so the closing marker landed alone
 * on the next line and never closed anything. repairSplitEmphasis() moves it back.
 * The buttons no longer do it (markdown-edit.ts in the admin); this is for the
 * descriptions already saved that way.
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
 * against text from the admin. No regex lookbehind anywhere in this file — it
 * runs in the browser, and Safari before 16.4 refuses to load a script that
 * contains one, which would take the whole product page with it.
 */

/** http(s) and mailto only. Anything else — javascript:, data:, vbscript: — is refused. */
function safeUrl(raw: string): string | null {
  const url = raw.trim()
  // A bare path or fragment can't carry a scheme, so it needs no scheme check —
  // but "//host/x" is NOT a path. The browser reads it as protocol-relative and
  // fetches it from that host, and it reads "/\\host/x" exactly the same way, so
  // both have to go through the scheme check below like any other address,
  // where they fail and are dropped.
  if ((url.startsWith("/") && !/^\/[\/\\]/.test(url)) || url.startsWith("#")) return url
  if (/^https?:\/\//i.test(url) || /^mailto:/i.test(url)) return url
  return null
}

// ── Mending split emphasis ──────────────────────────────────────────────────

/** How many times `marker` occurs in `line` as a delimiter of its own length. */
function markerCount(line: string, marker: string): number {
  if (marker.length === 2) return line.split(marker).length - 1
  // A single * or _: take the doubled ones out first, and a bullet's own marker.
  const bare = line.replace(/^\s*[-*+]\s+/, "").split(marker + marker).join("")
  return bare.split(marker).length - 1
}

/**
 * "**Headline\n**" becomes "**Headline**\n" — and "## **Title\n## **", which is
 * what the Heading button then made of it, becomes "## **Title**". Only a line
 * holding nothing but the marker (and perhaps a heading's #s) is moved, and only
 * back onto a line that opened that marker and never closed it.
 */
export function repairSplitEmphasis(text: string): string {
  const lines = text.split("\n")
  for (let i = 1; i < lines.length; i++) {
    const alone = lines[i].match(/^[ \t]*(?:#{1,6}[ \t]*)?(\*\*|__|\*|_)[ \t]*$/)
    if (!alone) continue
    const marker = alone[1]
    const prev = lines[i - 1]
    if (prev.trim() === "" || markerCount(prev, marker) % 2 === 0) continue
    lines[i - 1] = prev.replace(/[ \t]+$/, "") + marker
    lines[i] = ""
  }
  return lines.join("\n")
}

// ── Inline ──────────────────────────────────────────────────────────────────

const ESCAPABLE = "\\`*_{}[]()#+-.!|>"
const isSpace = (c: string | undefined) => c === undefined || /\s/.test(c)
const isWord = (c: string | undefined) => c !== undefined && /[\p{L}\p{N}]/u.test(c)

/**
 * Where links can close, worked out once per piece of text: for each position,
 * the next "]" on the same line, and for each "(" the ")" that balances it on
 * that line. Looking these up instead of scanning forward from every "[" keeps
 * a line full of links that never close — "[a](b [a](b …" — from turning
 * quadratic, which drew such a page in six seconds.
 */
type LinkIndex = { nextBracket: Int32Array; parenClose: Int32Array }

function linkIndexOf(text: string): LinkIndex {
  const n = text.length
  const nextBracket = new Int32Array(n + 1).fill(-1)
  let next = -1
  for (let j = n - 1; j >= 0; j--) {
    if (text[j] === "\n") next = -1
    else if (text[j] === "]") next = j
    nextBracket[j] = next
  }
  const parenClose = new Int32Array(n).fill(-1)
  const open: number[] = []
  for (let j = 0; j < n; j++) {
    const c = text[j]
    if (c === "\n") open.length = 0
    else if (c === "(") open.push(j)
    else if (c === ")" && open.length) parenClose[open.pop()!] = j
  }
  return { nextBracket, parenClose }
}

/** `[label](url)` starting at text[i] === "[", or null. The url may hold balanced parentheses. */
function readLink(text: string, i: number, index: LinkIndex): { label: string; url: string; end: number } | null {
  const close = index.nextBracket[i + 1]
  if (close === -1 || text[close + 1] !== "(") return null
  const end = index.parenClose[close + 1]
  if (end === -1) return null
  // An optional title after the address — [x](url "title") — is allowed and ignored.
  const inside = text.slice(close + 2, end).trim()
  const url = inside.match(/^(\S+)(?:\s+(?:"[^"]*"|'[^']*'))?$/)?.[1]
  if (!url) return null
  return { label: text.slice(i + 1, close), url, end: end + 1 }
}

/**
 * Every run of * or _ that could close an emphasis, by the exact run — "*", "**",
 * "___" — in order. A closer follows a non-space, and for _ doesn't sit inside a
 * word, so snake_case stays snake_case.
 *
 * Found once per piece of text and then looked up, rather than scanning forward
 * from each opener: text full of openers that never close ("*a *a *a …") made
 * that scan quadratic, and 20,000 of them took seven seconds to draw a page.
 */
function closersOf(text: string): Map<string, number[]> {
  const found = new Map<string, number[]>()
  for (let j = 0; j < text.length; j++) {
    if (text[j] === "\\") {
      j++
      continue
    }
    const ch = text[j]
    if (ch !== "*" && ch !== "_") continue
    let run = 0
    while (text[j + run] === ch) run++
    if (!isSpace(text[j - 1]) && !(ch === "_" && isWord(text[j + run]))) {
      const key = ch.repeat(run)
      const list = found.get(key)
      if (list) list.push(j)
      else found.set(key, [j])
    }
    j += run - 1
  }
  return found
}

/** The first closer for `marker` at or after `from`, or -1. */
function findCloser(closers: Map<string, number[]>, from: number, marker: string): number {
  const list = closers.get(marker)
  if (!list) return -1
  let lo = 0
  let hi = list.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (list[mid] < from) lo = mid + 1
    else hi = mid
  }
  return lo < list.length ? list[lo] : -1
}

type Counter = { n: number }

/** Bold, italic, links, images and line breaks within one block of text. */
function inline(text: string, keys: Counter): ReactNode[] {
  const out: ReactNode[] = []
  const closers = closersOf(text)
  const links = linkIndexOf(text)
  let buf = ""
  const flush = () => {
    if (buf) out.push(buf)
    buf = ""
  }

  let i = 0
  while (i < text.length) {
    const c = text[i]

    if (c === "\\" && i + 1 < text.length && ESCAPABLE.includes(text[i + 1])) {
      buf += text[i + 1]
      i += 2
      continue
    }

    if (c === "\n") {
      // Somebody who pressed Return once meant something by it.
      flush()
      out.push(<br key={keys.n++} />)
      i++
      continue
    }

    if (c === "[" || (c === "!" && text[i + 1] === "[")) {
      const image = c === "!"
      const link = readLink(text, image ? i + 1 : i, links)
      if (link) {
        flush()
        const href = safeUrl(link.url)
        const label = link.label || link.url
        if (!href) {
          // Refused address: keep the words, drop the address. Silently removing
          // the text would make it look like the description lost a sentence.
          out.push(label)
        } else if (image) {
          out.push(
            <img
              key={keys.n++}
              src={href}
              alt={link.label}
              loading="lazy"
              className="my-4 w-full rounded-2xl shadow-[var(--shadow-1)]"
            />,
          )
        } else {
          out.push(
            <a
              key={keys.n++}
              href={href}
              className="font-medium text-[var(--primary)] underline underline-offset-2"
              {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {inline(link.label || link.url, keys)}
            </a>,
          )
        }
        i = link.end
        continue
      }
    }

    if (c === "*" || c === "_") {
      let run = 0
      while (text[i + run] === c) run++
      // An opener has something right after it, and a _ can't start inside a word.
      const opens = !isSpace(text[i + run]) && !(c === "_" && isWord(text[i - 1]))
      if (opens) {
        // The whole run first, then shorter: ***x*** is bold and italic, ** bold,
        // * italic — and ****x****, which pressing Bold twice used to write, is
        // still bold rather than a row of asterisks. An even run is bold, an odd
        // one italic as well.
        const longest = Math.min(run, 6)
        const tries = Array.from({ length: longest }, (_, k) => longest - k)
        let done = false
        for (const len of tries) {
          const marker = c.repeat(len)
          const start = i + len
          const close = findCloser(closers, start, marker)
          if (close === -1 || close === start) continue
          flush()
          const inner = inline(text.slice(start, close), keys)
          const italic = len % 2 === 1
          out.push(
            len >= 2 ? (
              <strong key={keys.n++}>{italic ? <em>{inner}</em> : inner}</strong>
            ) : (
              <em key={keys.n++}>{inner}</em>
            ),
          )
          i = close + len
          done = true
          break
        }
        if (done) continue
      }
      // Nothing closes it: the characters are just characters.
      buf += c.repeat(run)
      i += run
      continue
    }

    buf += c
    i++
  }

  flush()
  return out
}

// ── Blocks ──────────────────────────────────────────────────────────────────

type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "list"; ordered: boolean; start: number; items: string[] }
  | { kind: "paragraph"; text: string }
  | { kind: "rule" }

const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/
const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/
// Any indentation before a list marker: pasting from a document indents list
// items with a tab or four spaces, and the renderer before this one took them.
// A nested list isn't supported, so an indented item joins the list it is in.
const BULLET = /^\s*[-*+][ \t]+(.*)$/
const NUMBER = /^\s*(\d{1,9})[.)][ \t]+(.*)$/
const IMAGE_ONLY = /^!\[[^\]]*\]\([^)\n]*\)$/

function parse(text: string): Block[] {
  const lines = repairSplitEmphasis(text.replace(/\r\n?/g, "\n").replace(/\t/g, "    ")).split("\n")
  const blocks: Block[] = []
  let para: string[] = []
  let list: Extract<Block, { kind: "list" }> | null = null
  // A blank line after a list item doesn't end the list yet: another item of the
  // same kind after it continues the same list, as it does in Markdown.
  let gap = false

  const endParagraph = () => {
    if (para.length) blocks.push({ kind: "paragraph", text: para.join("\n") })
    para = []
  }
  const endList = () => {
    if (list) blocks.push(list)
    list = null
    gap = false
  }

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "")

    if (line === "") {
      endParagraph()
      if (list) gap = true
      continue
    }

    const heading = line.match(HEADING)
    if (heading) {
      endParagraph()
      endList()
      // "##" with nothing after it is a stray marker, not a heading.
      if (heading[2]?.trim()) blocks.push({ kind: "heading", level: heading[1].length, text: heading[2].trim() })
      continue
    }

    if (RULE.test(line)) {
      endParagraph()
      endList()
      blocks.push({ kind: "rule" })
      continue
    }

    const bullet = line.match(BULLET)
    const number = bullet ? null : line.match(NUMBER)
    if (bullet || number) {
      endParagraph()
      const ordered = !!number
      if (!list || list.ordered !== ordered) {
        endList()
        list = { kind: "list", ordered, start: number ? parseInt(number[1], 10) : 1, items: [] }
      }
      list.items.push((bullet ? bullet[1] : number![2]).trim())
      gap = false
      continue
    }

    if (list) {
      // A line straight after an item carries that item on; after a blank line
      // it is a new paragraph and the list is over.
      if (!gap) {
        list.items[list.items.length - 1] += "\n" + line.trim()
        continue
      }
      endList()
    }
    para.push(line.trim())
  }

  endParagraph()
  endList()
  return blocks
}

/** Renders Markdown as elements. */
export function Markdown({ text, className = "" }: { text: string; className?: string }) {
  const keys: Counter = { n: 0 }

  return (
    // Block, not flex: a flex container ignores CSS columns entirely, and the
    // product page sets the description in two on a wide screen. space-y gives
    // the same stack this had.
    <div className={`space-y-4 ${className}`}>
      {parse(text).map((block, b) => {
        if (block.kind === "heading") {
          const size = block.level === 1 ? "text-2xl" : block.level === 2 ? "text-xl" : "text-lg"
          return (
            <h3 key={b} className={`font-display ${size} text-[var(--foreground)]`} style={{ fontWeight: 700 }}>
              {inline(block.text, keys)}
            </h3>
          )
        }

        if (block.kind === "rule") return <hr key={b} className="border-[var(--border)]" />

        if (block.kind === "list") {
          const items = block.items.map((item, i) => <li key={i}>{inline(item, keys)}</li>)
          return block.ordered ? (
            <ol
              key={b}
              start={block.start === 1 ? undefined : block.start}
              className="flex list-decimal flex-col gap-1.5 pl-5 marker:text-[var(--primary)]"
            >
              {items}
            </ol>
          ) : (
            <ul key={b} className="flex list-disc flex-col gap-1.5 pl-5 marker:text-[var(--primary)]">
              {items}
            </ul>
          )
        }

        // A paragraph that is nothing but pictures is drawn as the pictures —
        // wrapping them in <p> only puts a paragraph's spacing around an image.
        const lines = block.text.split("\n")
        if (lines.every((l) => IMAGE_ONLY.test(l))) {
          return <Fragment key={b}>{inline(block.text.replace(/\n/g, ""), keys)}</Fragment>
        }
        return <p key={b}>{inline(block.text, keys)}</p>
      })}
    </div>
  )
}
