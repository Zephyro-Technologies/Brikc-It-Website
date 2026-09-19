import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Lets the admin panel tell the storefront to rebuild the pages it just
 * changed, so saving a product shows up in seconds without making every page
 * dynamic.
 *
 *   POST /api/revalidate
 *   x-revalidate-secret: <shared secret>
 *   { "paths": ["/", "/shop/scuderia-sf-24"] }
 */

export const dynamic = "force-dynamic"

/**
 * A cap on one request, not on what a save may invalidate. The admin batches
 * anything longer into several calls (STOREFRONT_PATH_LIMIT in its
 * revalidate-storefront route mirrors this number) — raise one and raise both,
 * because what spills past this is dropped without saying so.
 */
const MAX_PATHS = 50

export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET

  // A missing secret must fail closed — otherwise a misconfigured deploy would
  // leave the endpoint open to anyone.
  if (!expected) {
    return NextResponse.json(
      { revalidated: false, error: "REVALIDATE_SECRET is not configured" },
      { status: 503 },
    )
  }

  if (request.headers.get("x-revalidate-secret") !== expected) {
    return NextResponse.json({ revalidated: false, error: "Unauthorized" }, { status: 401 })
  }

  let paths: unknown
  try {
    paths = (await request.json())?.paths
  } catch {
    return NextResponse.json({ revalidated: false, error: "Expected a JSON body" }, { status: 400 })
  }

  if (!Array.isArray(paths) || paths.some((p) => typeof p !== "string")) {
    return NextResponse.json(
      { revalidated: false, error: "Expected { paths: string[] }" },
      { status: 400 },
    )
  }

  // Only same-origin app paths: revalidatePath takes a route, not a URL.
  const safe = (paths as string[])
    .filter((p) => p.startsWith("/") && !p.startsWith("//"))
    .slice(0, MAX_PATHS)

  for (const path of safe) revalidatePath(path)

  return NextResponse.json({ revalidated: true, paths: safe, at: new Date().toISOString() })
}
