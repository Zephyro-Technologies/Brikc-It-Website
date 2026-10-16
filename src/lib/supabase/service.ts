import "server-only"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

/**
 * The one place this app holds more than the publishable key — and only so the
 * payment routes can call the three functions nothing public may reach:
 * pay_online_start, attach_payment_session and settle_payment, each granted to
 * service_role alone. A function that marks an order paid, callable with the
 * key every visitor's browser has, would be a way to get goods for nothing.
 *
 * `server-only` makes the build fail if a client component ever imports this.
 * SUPABASE_SECRET_KEY is a Worker secret (DEPLOYMENT.md §5) and never a
 * NEXT_PUBLIC_ variable, which would inline it into every page.
 */
export function serviceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) throw new Error("SUPABASE_SECRET_KEY is not set")
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
