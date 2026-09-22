"use client"

import { useEffect, useState } from "react"

/**
 * The photograph behind the homepage hero: the categories' own cover images,
 * crossfading.
 *
 * Those covers are set in the admin and, until now, the storefront only ever
 * rendered a category's name — the image was editable and rendered nowhere,
 * which is the thing CLAUDE.md lists as stranded. This is where it lands.
 *
 * Three things it is careful about:
 *
 *  - **The first image is the LCP.** Only it is rendered on the server and in
 *    the first client pass; the rest mount after that, so the hero's largest
 *    paint is one image loading alone rather than five racing it. Both passes
 *    render the same markup, so there is nothing for hydration to disagree
 *    about.
 *  - **One image does not rotate.** No timer is started, so a shop with a
 *    single category cover costs nothing and never flickers.
 *  - **Reduced motion means no motion.** A crossfading backdrop behind text is
 *    exactly what that setting is asking not to have, so it holds on the first
 *    image rather than fading more slowly.
 */

/** Long enough to look at, short enough that a second one is worth waiting for. */
const HOLD_MS = 5200

/**
 * Five covers is plenty of variety, and every one of them is a full-bleed
 * photograph the homepage has to download. A shop with twelve categories
 * should not ship twelve of them.
 */
const MAX_IMAGES = 5

export function HeroBackdrop({ images, fallback }: { images: string[]; fallback: string }) {
  // Deduplicated: two categories can legitimately share a cover, and fading
  // from an image to itself reads as a stutter rather than a transition.
  const sources = [...new Set(images.filter(Boolean))].slice(0, MAX_IMAGES)
  const shown = sources.length > 0 ? sources : [fallback]

  const [index, setIndex] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (shown.length < 2) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reduced.matches) return

    const timer = setInterval(() => setIndex((i) => (i + 1) % shown.length), HOLD_MS)
    return () => clearInterval(timer)
  }, [shown.length])

  return (
    <>
      {shown.map((src, i) => {
        // Before mount only the first exists, so the server's HTML and the
        // first client render are identical.
        if (!mounted && i > 0) return null
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden
            // The first is the one the page is waiting on; the others arrive
            // whenever they arrive.
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "low"}
            style={{ backgroundColor: "#eceae7" }}
            className={`absolute inset-0 h-full w-full object-cover brightness-[0.78] transition-opacity duration-1000 ease-in-out motion-reduce:transition-none ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          />
        )
      })}
    </>
  )
}
