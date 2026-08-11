import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

/**
 * The storefront only ever reads, and never on behalf of a signed-in user, so
 * one plain client with the publishable key is all it needs — no cookie
 * handling, no session to persist. Row Level Security limits this key to the
 * public catalogue and published content.
 */
export function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and fill in " +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    )
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
