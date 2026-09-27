"use client"

import { useEffect, useRef } from "react"
import { fromPrice, type Product } from "../data"
import { CURRENCY, track } from "./pixel"

/**
 * One ViewContent per build a shopper opens — keyed on the slug, because the
 * detail views are reused when a shopper follows a suggestion to another build.
 * The value is the "from" price the cards quote; a build nobody can order right
 * now is still a view, just without one. The ref makes it one per build even
 * where React runs an effect twice, as it does in development.
 */
export function useViewContent(product: Product | undefined) {
  const slug = product?.slug
  const sent = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!product || sent.current === product.slug) return
    sent.current = product.slug
    const price = fromPrice(product)
    track("ViewContent", {
      content_ids: [product.slug],
      content_name: product.name,
      content_type: "product",
      ...(price > 0 && { value: price, currency: CURRENCY }),
    })
  }, [slug])
}
