import type { MetadataRoute } from "next"
import { SITE_URL } from "../lib/seo"

/**
 * /robots.txt. Cloudflare puts its own managed block in front of this (allow
 * everything, refuse the AI trainers), so what is here is only what the shop
 * adds: keep crawlers out of the checkout and the API, and say where the
 * sitemap is.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/checkout", "/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
