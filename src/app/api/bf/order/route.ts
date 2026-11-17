import { NextResponse } from "next/server"
import { serviceSupabase } from "../../../../lib/supabase/service"
import { wireLines, type WireLine } from "../../../../lib/order-lines"
import { PaymentRefused, startOnlinePayment, type OnlinePayment } from "../../../../lib/pay-online"
import { mayPayOnline } from "../../../../lib/rapid-gateway"
import {
  BF_DEALS,
  BF_DOUBLE,
  BUILDER_SLUGS,
  BUILDER_TIERS,
  builderPrice,
  bfState,
  saleFormat,
  type BfSelection,
} from "../../../../lib/black-friday"

/**
 * Takes an order that contains at least one Blessed Friday line.
 *
 * Why this exists: the shop's own door, `place_order`, prices every line from
 * the product's own columns — by design nothing else can name a price. A sale
 * price that ISN'T the product's price therefore can't pass through it, and
 * the database schema is the developer's to change, not ours. So for the one
 * week of the sale this route does what `place_order` does — validate, price
 * server-side, refuse what the shelf can't cover — with the sale config as the
 * price list, and writes the same rows place_order writes:
 *
 *   orders → order_lines (+ order_line_members for a bundle) → the first
 *   order_status_events row, last, because that insert is what makes the
 *   database email the customer and the owners.
 *
 * Everything downstream is untouched and keeps working by construction: the
 * admin shows the order like any other; marking it paid moves stock through
 * the existing trigger — plain lines by product_id, bundle lines through
 * their order_line_members snapshot; emails, Meta's Purchase and Rapid
 * Gateway all key off the order row, not off how it was created.
 *
 * The browser still never names a price. A BF line carries which offer and
 * which cars; a normal line carries slug/format/frame/variant. Amounts come
 * from the config and the database, here.
 *
 * This runs with the service key (anon can't insert orders, rightly), the
 * same key the payment routes already hold. Delete this route with the rest
 * of the Blessed Friday code when the sale is done.
 */

export const dynamic = "force-dynamic"

/** Refusals written for the shopper — same contract as place_order's 22023s. */
class Refused extends Error {}

const str = (v: unknown) => (typeof v === "string" ? v : "")

type BfWireLine = { bf: BfSelection; qty: number }

function isBfLine(l: unknown): l is BfWireLine {
  if (typeof l !== "object" || l === null) return false
  const bf = (l as { bf?: unknown }).bf
  if (typeof bf !== "object" || bf === null) return false
  const kind = (bf as { kind?: unknown }).kind
  return kind === "builder" || kind === "deal" || kind === "double"
}

/** The columns every line here is priced and checked against. */
type Row = {
  id: string
  slug: string
  name: string
  kind: string
  stock: number
  price_boxed: number
  price_built: number
  price_frame_plain: number
  price_frame_led: number
  sells_boxed: boolean
  sells_built: boolean
  sells_framed: boolean
  bundle_price: number
  product_images: { url: string; sort: number }[]
  product_variants: { id: string; label: string; price: number; stock: number }[]
}

function firstImage(row: Row): string {
  return [...(row.product_images ?? [])].sort((a, b) => a.sort - b.sort)[0]?.url ?? ""
}

/** Mirrors place_order's field checks, message for message where it matters. */
function checkCustomer(c: { name: string; email: string; phone: string }, a: Record<string, string>) {
  if (!c.name || c.name.length > 120) throw new Refused("Please give a name we can put on the parcel.")
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email) || c.email.length > 200)
    throw new Refused("That email address does not look right.")
  if (c.phone.length < 7 || c.phone.length > 40)
    throw new Refused("Please give a phone number the courier can reach.")
  if (!a.line1 || !a.city) throw new Refused("Please give a delivery address and city.")
  if (a.line1.length > 200 || (a.line2 ?? "").length > 200 || a.city.length > 80 || (a.province ?? "").length > 80 || (a.postcode ?? "").length > 20)
    throw new Refused("That address is longer than we can store.")
}

/** Letters-only containment — mirrors private.city_qualifies in the database. */
function cityQualifies(city: string, towns: string): boolean {
  const typed = city.toLowerCase().replace(/[^a-z]/g, "")
  if (!typed) return false
  return towns
    .split(",")
    .map((t) => t.toLowerCase().replace(/[^a-z]/g, ""))
    .some((want) => want.length > 0 && typed.includes(want))
}

/** One priced order line, plus the member snapshot when it is a bundle. */
type PricedLine = {
  product_id: string | null
  slug: string
  name: string
  image: string
  format: "boxed" | "built" | null
  with_frame: boolean
  frame_led: boolean
  variant_label: string
  variant_id: string | null
  unit_price: number
  qty: number
  bundle: boolean
  members: {
    product_id: string
    variant_id: null
    slug: string
    name: string
    image: string
    format: "boxed"
    with_frame: false
    frame_led: false
    variant_label: ""
    qty: number
    sort: number
  }[]
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "That request wasn't valid JSON." }, { status: 400 })
  }

  // The window is checked on the server's clock, so a tab left open past the
  // end — or a hand-made request — is refused however the page looked.
  const state = bfState()
  if (state !== "live") {
    const msg =
      state === "ended"
        ? "The Blessed Friday sale has ended. Remove the sale items from your cart to order the rest."
        : "The Blessed Friday sale hasn't started yet."
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  let db: ReturnType<typeof serviceSupabase>
  try {
    db = serviceSupabase()
  } catch {
    // No SUPABASE_SECRET_KEY — local dev without the secret, or a deploy that
    // missed it. Fail closed and say so plainly.
    return NextResponse.json(
      { error: "Blessed Friday checkout isn't configured on this server yet." },
      { status: 503 },
    )
  }

  try {
    const customer = (body.customer ?? {}) as Record<string, unknown>
    const address = (body.address ?? {}) as Record<string, unknown>
    const c = {
      name: str(customer.name).trim(),
      email: str(customer.email).trim().toLowerCase(),
      phone: str(customer.phone).trim(),
    }
    const a = {
      line1: str(address.line1).trim(),
      line2: str(address.line2).trim(),
      city: str(address.city).trim(),
      province: str(address.province).trim(),
      postcode: str(address.postcode).trim(),
    }
    checkCustomer(c, a)

    // ── Split the cart ────────────────────────────────────────────────────
    const rawLines = Array.isArray(body.lines) ? (body.lines as unknown[]) : []
    if (rawLines.length === 0 || rawLines.length > 20)
      throw new Refused("An order has to have between 1 and 20 lines.")

    const bfLines: BfWireLine[] = []
    const normalRaw: unknown[] = []
    for (const l of rawLines) {
      if (isBfLine(l)) {
        const qty = Number((l as { qty?: unknown }).qty) || 0
        if (!Number.isInteger(qty) || qty < 1 || qty > 10)
          throw new Refused("Quantities have to be whole numbers between 1 and 10.")
        bfLines.push({ bf: (l as BfWireLine).bf, qty })
      } else {
        normalRaw.push(l)
      }
    }
    if (bfLines.length === 0)
      throw new Refused("There are no Blessed Friday items in this order — use the normal checkout.")
    const normalLines: WireLine[] = wireLines({ lines: normalRaw })

    // ── Everything the order touches, read once ───────────────────────────
    const slugs = new Set<string>()
    for (const l of bfLines) {
      const sel = l.bf
      if (sel.kind === "deal") slugs.add(sel.slug)
      else if (sel.kind === "double") BF_DOUBLE.slugs.forEach((s) => slugs.add(s))
      else if (Array.isArray(sel.picks))
        sel.picks.forEach((p) => {
          const slug = (p as { slug?: unknown } | null)?.slug
          if (typeof slug === "string" && slug) slugs.add(slug)
        })
    }
    for (const l of normalLines) slugs.add(l.slug)

    const { data: rows, error: readError } = await db
      .from("products")
      .select(
        "id, slug, name, kind, stock, price_boxed, price_built, price_frame_plain, price_frame_led, sells_boxed, sells_built, sells_framed, bundle_price, product_images ( url, sort ), product_variants ( id, label, price, stock )",
      )
      .in("slug", [...slugs])
    if (readError) throw new Error(`reading products: ${readError.message}`)
    const bySlug = new Map((rows ?? []).map((r) => [r.slug, r as unknown as Row]))

    const need = (slug: string): Row => {
      const row = bySlug.get(slug)
      if (!row) throw new Refused("One of those items is no longer in the catalogue.")
      return row
    }

    /** A sale member must be a model sold unassembled, still priced. */
    const saleModel = (slug: string): Row => {
      const row = need(slug)
      if (row.kind !== "model" || !row.sells_boxed || row.price_boxed <= 0)
        throw new Refused(`${row.name} is no longer part of this offer.`)
      return row
    }

    // ── Price every line ──────────────────────────────────────────────────
    const priced: PricedLine[] = []
    // How many units of each build this whole order wants — checked against
    // the shelf once, across every line, so two lines can't share one unit.
    const demand = new Map<string, number>()
    const shelf = new Map<string, { name: string; stock: number }>()
    const wants = (row: { id: string; name: string; stock: number }, qty: number) => {
      demand.set(row.id, (demand.get(row.id) ?? 0) + qty)
      shelf.set(row.id, { name: row.name, stock: row.stock })
    }
    const variantDemand = new Map<string, { label: string; owner: string; qty: number }>()

    for (const { bf, qty } of bfLines) {
      if (bf.kind === "deal") {
        const price = BF_DEALS[bf.slug]
        if (!price) throw new Refused("That offer is not part of the sale.")
        const row = need(bf.slug)
        // A deal sells the build in its own cheapest sold assembly — boxed for
        // the F1 kits, built for the Shelby, decided by the same saleFormat()
        // the page used to draw the card.
        const sold = row.kind === "model"
          ? saleFormat({ sellsBoxed: row.sells_boxed, sellsBuilt: row.sells_built, priceBoxed: row.price_boxed, priceBuilt: row.price_built })
          : null
        if (!sold) throw new Refused(`${row.name} is no longer part of this offer.`)
        wants(row, qty)
        priced.push({
          product_id: row.id,
          slug: row.slug,
          name: `${row.name} — Blessed Friday`,
          image: firstImage(row),
          format: sold.format,
          with_frame: false,
          frame_led: false,
          variant_label: "",
          variant_id: null,
          unit_price: price,
          qty,
          bundle: false,
          members: [],
        })
      } else if (bf.kind === "double") {
        const members = BF_DOUBLE.slugs.map((s) => saleModel(s))
        members.forEach((m) => wants(m, qty))
        priced.push({
          product_id: null,
          slug: "blessed-friday-double",
          name: "RB20 + McLaren Double — Blessed Friday",
          image: firstImage(members[0]),
          format: null,
          with_frame: false,
          frame_led: false,
          variant_label: "",
          variant_id: null,
          unit_price: BF_DOUBLE.price,
          qty,
          bundle: true,
          members: members.map((m, sort) => ({
            product_id: m.id,
            variant_id: null,
            slug: m.slug,
            name: m.name,
            image: firstImage(m),
            format: "boxed" as const,
            with_frame: false as const,
            frame_led: false as const,
            variant_label: "" as const,
            qty: 1,
            sort,
          })),
        })
      } else {
        // The pick-your-own bundle. The tier must be one that exists, the
        // picks must add up to exactly that many cars, and every pick must be
        // a Speed Champions single from the list — the page can't be made to
        // sell three big models for Rs 8,999 by editing localStorage.
        if (!BUILDER_TIERS[bf.tier])
          throw new Refused("That bundle size is not part of the sale.")
        const rawPicks = Array.isArray(bf.picks) ? bf.picks : []
        const picks = rawPicks.map((p) => ({
          slug: str((p as { slug?: unknown } | null)?.slug),
          qty: Number((p as { qty?: unknown } | null)?.qty),
        }))
        if (picks.length === 0) throw new Refused("Pick some cars for the bundle first.")
        if (picks.some((p) => !Number.isInteger(p.qty) || p.qty < 1))
          throw new Refused("Quantities have to be whole numbers.")
        if (picks.some((p) => !BUILDER_SLUGS.includes(p.slug)))
          throw new Refused("One of those cars is not part of this offer.")
        if (new Set(picks.map((p) => p.slug)).size !== picks.length)
          throw new Refused("That bundle lists the same car twice — add it again.")
        const count = picks.reduce((n, p) => n + p.qty, 0)
        if (count !== bf.tier)
          throw new Refused(`That bundle needs exactly ${bf.tier} cars — it has ${count}.`)

        const members = picks.map((p, sort) => {
          const row = saleModel(p.slug)
          wants(row, p.qty * qty)
          return {
            product_id: row.id,
            variant_id: null,
            slug: row.slug,
            name: row.name,
            image: firstImage(row),
            format: "boxed" as const,
            with_frame: false as const,
            frame_led: false as const,
            variant_label: "" as const,
            qty: p.qty,
            sort,
            _name: row.name,
          }
        })
        const price = builderPrice(bf.tier, picks, (s) => bySlug.get(s)?.price_boxed ?? 0)
        priced.push({
          product_id: null,
          slug: `blessed-friday-pick-${bf.tier}`,
          name: `Speed Champions Bundle — pick ${bf.tier} (Blessed Friday)`,
          image: firstImage(need(picks[0].slug)),
          format: null,
          with_frame: false,
          frame_led: false,
          variant_label: "",
          variant_id: null,
          unit_price: price,
          qty,
          bundle: true,
          members: members.map(({ _name: _unused, ...m }) => m),
        })
      }
    }

    // Ordinary lines riding along in the same order — priced from the same
    // columns private.price_line reads, with its messages. A deliberate,
    // temporary double of that function's model/display/bundle branches,
    // confined to this route and deleted with it; the alternative was a
    // second order (and a second transfer) for anything bought alongside a
    // sale item.
    for (const l of normalLines) {
      if (!Number.isInteger(l.qty) || l.qty < 1 || l.qty > 10)
        throw new Refused("Quantities have to be whole numbers between 1 and 10.")
      const row = need(l.slug)
      if (row.stock <= 0) throw new Refused(`${row.name} is sold out.`)

      if ("variant" in l) {
        if (row.kind !== "display") throw new Refused(`${row.name} is not sold by size.`)
        const v = (row.product_variants ?? []).find((x) => x.id === l.variant)
        if (!v) throw new Refused(`That option for ${row.name} is no longer available.`)
        if (v.stock <= 0) throw new Refused(`${row.name} — ${v.label} is sold out.`)
        const vd = variantDemand.get(v.id) ?? { label: v.label, owner: row.name, qty: 0 }
        vd.qty += l.qty
        variantDemand.set(v.id, vd)
        if (vd.qty > v.stock) throw new Refused(`Only ${v.stock} of ${row.name} — ${v.label} left.`)
        priced.push({
          product_id: row.id, slug: row.slug, name: row.name, image: firstImage(row),
          format: null, with_frame: false, frame_led: false,
          variant_label: v.label, variant_id: v.id,
          unit_price: v.price, qty: l.qty, bundle: false, members: [],
        })
      } else if ("format" in l) {
        if (row.kind !== "model") throw new Refused(`Please choose how ${row.name} is sold.`)
        if (l.format !== "boxed" && l.format !== "built")
          throw new Refused(`Please add ${row.name} to your cart again.`)
        const sold = l.format === "built" ? row.sells_built : row.sells_boxed
        const base = l.format === "built" ? row.price_built : row.price_boxed
        if (!sold || base <= 0)
          throw new Refused(`${row.name} is not sold ${l.format === "built" ? "assembled" : "unassembled"}.`)
        const frame = l.frame === "led" || l.frame === "plain" ? l.frame : "none"
        const frameCost = frame === "led" ? row.price_frame_led : frame === "plain" ? row.price_frame_plain : 0
        if (frame !== "none" && (!row.sells_framed || frameCost <= 0))
          throw new Refused(`${row.name} is not sold with that frame.`)
        wants(row, l.qty)
        priced.push({
          product_id: row.id, slug: row.slug, name: row.name, image: firstImage(row),
          format: l.format, with_frame: frame !== "none", frame_led: frame === "led",
          variant_label: "", variant_id: null,
          unit_price: base + frameCost, qty: l.qty, bundle: false, members: [],
        })
      } else {
        // A catalogue bundle (kind='bundle'), as place_order sells it. Its
        // member snapshot comes from bundle_items, like place_order's does.
        if (row.kind !== "bundle") throw new Refused(`Please choose how ${row.name} is sold.`)
        if (row.bundle_price <= 0) throw new Refused(`${row.name} has no price set.`)
        wants(row, l.qty)
        const { data: items, error: itemsError } = await db
          .from("bundle_items")
          .select("product_id, variant_id, qty, format, with_frame, frame_led, sort, products!bundle_items_product_id_fkey ( slug, name, product_images ( url, sort ) ), product_variants ( label )")
          .eq("bundle_id", row.id)
          .order("sort")
        if (itemsError) throw new Error(`reading bundle items: ${itemsError.message}`)
        if (!items?.length) throw new Refused(`${row.name} has nothing in it.`)
        const { data: memberStock, error: memberStockError } = await db
          .from("products")
          .select("id, name, stock")
          .in("id", items.map((i) => i.product_id as unknown as string))
        if (memberStockError)
          throw new Error(`reading bundle member stock: ${memberStockError.message}`)
        for (const i of items) {
          const m = (memberStock ?? []).find((r) => r.id === (i.product_id as unknown as string))
          if (m) wants(m, i.qty * l.qty)
        }
        priced.push({
          product_id: row.id, slug: row.slug, name: row.name, image: firstImage(row),
          format: null, with_frame: false, frame_led: false,
          variant_label: "", variant_id: null,
          unit_price: row.bundle_price, qty: l.qty, bundle: true,
          members: items.map((i) => {
            const p = i.products as unknown as { slug: string; name: string; product_images: { url: string; sort: number }[] } | null
            const v = i.product_variants as unknown as { label: string } | null
            return {
              product_id: i.product_id as unknown as string,
              variant_id: (i.variant_id ?? null) as null,
              slug: p?.slug ?? "",
              name: p?.name ?? "",
              image: [...(p?.product_images ?? [])].sort((x, y) => x.sort - y.sort)[0]?.url ?? "",
              format: (i.format ?? (i.variant_id ? null : "boxed")) as "boxed",
              with_frame: Boolean(i.with_frame) as false,
              frame_led: Boolean(i.frame_led) as false,
              variant_label: (v?.label ?? "") as "",
              qty: i.qty,
              sort: i.sort,
            }
          }),
        })
      }
    }

    // ── The shelf, once, for the whole order ──────────────────────────────
    for (const [productId, qty] of demand) {
      const row = shelf.get(productId)
      if (!row) continue
      if (qty > row.stock)
        throw new Refused(
          row.stock <= 0
            ? `${row.name} is sold out.`
            : `Only ${row.stock} of ${row.name} left.`,
        )
    }

    // ── Delivery ──────────────────────────────────────────────────────────
    const method = str(body.shippingMethod) === "teamhq" ? "teamhq" : "standard"
    let shipping = 0
    if (method === "teamhq") {
      const { data: s, error: sErr } = await db
        .from("settings")
        .select("teamhq_fee, teamhq_cities")
        .limit(1)
        .maybeSingle()
      if (sErr || !s) throw new Error(`reading settings: ${sErr?.message ?? "no row"}`)
      const towns = (s.teamhq_cities ?? "").trim()
      if (!towns) throw new Refused("Hand delivery is not available at the moment.")
      if (!cityQualifies(a.city, towns))
        throw new Refused(`Hand delivery only covers ${towns}. Choose standard delivery for ${a.city}.`)
      shipping = s.teamhq_fee ?? 0
    }

    const subtotal = priced.reduce((n, l) => n + l.unit_price * l.qty, 0)
    const total = subtotal + shipping

    // Online only while the gateway allows this customer — same gate as
    // /api/orders, enforced here rather than trusted from the page.
    const wantsOnline = body.paymentMethod === "online"
    const online = wantsOnline && mayPayOnline(c.email)

    // ── Write the order, the way place_order and the admin's createOrder do ─
    // Three requests, in an order that matters: the lines must exist before
    // the first status event lands, because that event is what makes the
    // database email the customer and the owners — and the email reads the
    // lines. A failure in the middle leaves an order with no event: nothing
    // is emailed, nothing moves, and it shows in the admin to be finished or
    // cancelled by hand.
    const cookieVal = (name: string): string => {
      for (const part of (request.headers.get("cookie") ?? "").split(";")) {
        const [key, ...value] = part.trim().split("=")
        if (key === name) return value.join("=")
      }
      return ""
    }

    const { data: order, error: orderError } = await db
      .from("orders")
      .insert({
        customer_name: c.name,
        customer_email: c.email,
        customer_phone: c.phone,
        ship_line1: a.line1,
        ship_line2: a.line2 || null,
        ship_city: a.city,
        ship_province: a.province,
        ship_postcode: a.postcode,
        subtotal,
        shipping,
        discount: 0,
        coupon_code: "",
        total,
        status: "pending_payment",
        source: "storefront",
        shipping_method: method,
        payment_method: online ? "online" : "transfer",
        meta_fbp: cookieVal("_fbp").slice(0, 255) || null,
        meta_fbc: cookieVal("_fbc").slice(0, 255) || null,
        client_ip: (request.headers.get("cf-connecting-ip") ?? "").slice(0, 64) || null,
        client_user_agent: (request.headers.get("user-agent") ?? "").slice(0, 512) || null,
      })
      .select("id, number")
      .single()
    if (orderError || !order) throw new Error(`creating the order: ${orderError?.message}`)

    // place_order writes the whole order in one transaction; this route cannot,
    // so a failure after the orders row exists must take that row with it
    // (lines and members cascade) — otherwise "please try again" would leave an
    // itemless order behind and mint a second one beside it.
    try {
      const { data: lineRows, error: linesError } = await db
        .from("order_lines")
        .insert(
          priced.map((l) => ({
            order_id: order.id,
            product_id: l.product_id,
            slug: l.slug,
            name: l.name,
            image: l.image,
            format: l.format,
            with_frame: l.with_frame,
            frame_led: l.frame_led,
            variant_label: l.variant_label,
            variant_id: l.variant_id,
            unit_price: l.unit_price,
            qty: l.qty,
            bundle: l.bundle,
          })),
        )
        .select("id")
      if (linesError || !lineRows) throw new Error(`saving the order items: ${linesError?.message}`)

      const memberRows = priced.flatMap((l, i) =>
        l.members.map((m) => ({ ...m, order_line_id: lineRows[i].id })),
      )
      if (memberRows.length) {
        const { error: membersError } = await db.from("order_line_members").insert(memberRows)
        if (membersError) throw new Error(`saving the bundle contents: ${membersError.message}`)
      }

      const { error: eventError } = await db.from("order_status_events").insert({
        order_id: order.id,
        status: "pending_payment",
        note: online
          ? "Placed on the storefront — Blessed Friday offer, paying online through Rapid Gateway."
          : "Placed on the storefront — Blessed Friday offer, waiting on the transfer receipt.",
      })
      if (eventError) throw new Error(`recording the order: ${eventError.message}`)
    } catch (err) {
      await db.from("orders").delete().eq("id", order.id)
      throw err
    }

    // ── Online payment session, exactly as /api/orders does it ────────────
    let payment: OnlinePayment | null = null
    let paymentError = wantsOnline && !online
      ? "Online payment isn't available for this order. Please pay by bank transfer."
      : ""
    if (online) {
      try {
        payment = await startOnlinePayment(order.number, c.email)
      } catch (err) {
        paymentError =
          err instanceof PaymentRefused ? err.message : "Online payment couldn't be started just now."
        if (!(err instanceof PaymentRefused)) console.error(`Online payment for ${order.number}:`, err)
      }
    }

    return NextResponse.json({
      number: order.number,
      total,
      shipping,
      discount: 0,
      coupon: "",
      ...(wantsOnline && { payment, paymentError }),
    })
  } catch (err) {
    if (err instanceof Refused) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error("bf/order failed", err)
    return NextResponse.json(
      { error: "We couldn't place that order. Please try again, or message us and we'll sort it." },
      { status: 500 },
    )
  }
}
