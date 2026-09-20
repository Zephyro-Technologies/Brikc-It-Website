import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { pathsFor, type Change } from "../../../../lib/revalidate-paths"

/**
 * Lets the database say a row changed, and works out the pages itself.
 *
 *   POST /api/revalidate/changed
 *   x-revalidate-secret: <shared secret>
 *   { "table": "products", "op": "UPDATE", "kind": "model", "slug": "f1mclaren" }
 *
 * The sibling /api/revalidate takes a list of paths and rebuilds exactly those.
 * That is the right shape for a caller that knows the site — the admin, or a
 * person with curl. It is the wrong shape for a trigger, which knows a row and
 * nothing else, and it is the wrong shape for anyone who has to keep a copy of
 * the route map in step with this repo.
 *
 * It also only ever fired for writes the admin made. Stock moves when an order
 * is marked paid, through a trigger; a variant's count rolls up into its parent,
 * through a trigger; a category rename cascades to every build carrying it. None
 * of those is a line of admin code, so none of them rebuilt anything. Postgres
 * knows about all of them.
 */

export const dynamic = "force-dynamic"

/** Sanity bound. The list is computed from our own catalogue, so this is a tripwire, not a policy. */
const MAX_PATHS = 200

function readChange(body: unknown): Change | null {
  if (typeof body !== "object" || body === null) return null
  const b = body as Record<string, unknown>
  if (typeof b.table !== "string" || !b.table) return null
  const str = (v: unknown) => (typeof v === "string" && v ? v : null)
  return {
    table: b.table,
    op: b.op === "INSERT" || b.op === "UPDATE" || b.op === "DELETE" ? b.op : undefined,
    kind: b.kind === "display" || b.kind === "model" ? b.kind : null,
    slug: str(b.slug),
    oldSlug: str(b.oldSlug),
  }
}

export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET

  // Fails closed, the same as /api/revalidate: a deploy that forgot the secret
  // must not leave this open.
  if (!expected) {
    return NextResponse.json(
      { revalidated: false, error: "REVALIDATE_SECRET is not configured" },
      { status: 503 },
    )
  }

  if (request.headers.get("x-revalidate-secret") !== expected) {
    return NextResponse.json({ revalidated: false, error: "Unauthorized" }, { status: 401 })
  }

  let change: Change | null
  try {
    change = readChange(await request.json())
  } catch {
    return NextResponse.json({ revalidated: false, error: "Expected a JSON body" }, { status: 400 })
  }

  if (!change) {
    return NextResponse.json(
      { revalidated: false, error: "Expected { table: string, … }" },
      { status: 400 },
    )
  }

  let paths: string[]
  try {
    paths = [...new Set(await pathsFor(change))].slice(0, MAX_PATHS)
  } catch (err) {
    // Working out the pages needs the catalogue. If that read fails we have not
    // rebuilt anything, and saying so is what gets it retried.
    console.error("revalidate/changed: could not resolve paths", err)
    return NextResponse.json(
      { revalidated: false, error: "Could not resolve paths" },
      { status: 502 },
    )
  }

  // An unknown table is not an error — it is a table with no page, and the
  // trigger is allowed to be broader than the site.
  for (const path of paths) revalidatePath(path)

  return NextResponse.json({
    revalidated: true,
    table: change.table,
    paths,
    at: new Date().toISOString(),
  })
}
