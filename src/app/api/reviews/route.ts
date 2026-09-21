import { NextResponse } from "next/server"
import { supabase } from "../../../lib/supabase/client"

/**
 * Takes a review from the form on a build's page.
 *
 * Thin, for the same reason `/api/orders` is thin: everything that decides
 * whether this is allowed lives in `submit_review` in Postgres. It checks the
 * order number against the email on that order, checks the order actually
 * contained the build being reviewed, refuses a second review of the same build
 * on the same order, and stores the whole thing `pending` so nothing a stranger
 * writes is ever public until somebody publishes it.
 *
 * `anon` has no INSERT on `reviews` at all — only EXECUTE on that function — so
 * this route is not a gate that could be walked around. It is a shape.
 *
 * What it returns is an upload token: a one-hour, one-review key that the
 * browser uses to put photographs and a video in a folder named after it. That
 * is the only write `anon` has anywhere in storage.
 */

export const dynamic = "force-dynamic"

/** Our own validation failures, raised with errcode 22023, are safe to show. */
const USER_ERROR = "22023"

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "That request wasn't valid JSON." }, { status: 400 })
  }

  const str = (v: unknown) => (typeof v === "string" ? v : "")

  const { data, error } = await supabase().rpc("submit_review", {
    p_order_number: str(body.orderNumber).slice(0, 40),
    p_email: str(body.email).slice(0, 200),
    p_slug: str(body.slug).slice(0, 200),
    p_name: str(body.name).slice(0, 80),
    p_rating: Number(body.rating) || 0,
    p_quote: str(body.quote).slice(0, 2000),
  })

  if (error) {
    // Validation messages are written for the person reading them and are
    // forwarded as they are. Anything else is ours to fix, not theirs to read.
    if (error.code === USER_ERROR) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("submit_review failed", error)
    return NextResponse.json(
      { error: "We couldn't save that review. Please try again." },
      { status: 500 },
    )
  }

  const result = data as { token: string; build: string } | null
  if (!result?.token) {
    console.error("submit_review returned nothing usable", data)
    return NextResponse.json(
      { error: "We couldn't save that review. Please try again." },
      { status: 500 },
    )
  }

  return NextResponse.json(result)
}
