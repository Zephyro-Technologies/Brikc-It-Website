/**
 * The booklet guides behind /booklets.
 *
 * Hardcoded like the display finishes — the admin has no screen for them. The
 * FAQ on the same page does come from Supabase, so anything a shopper asks
 * often belongs there rather than here.
 *
 * Nothing in this copy may promise something the shop doesn't do. There is no
 * brikc.it app and no download file yet, so the guides read here in full.
 */

export type Guide = {
  id: string
  title: string
  desc: string
  pages: number
  icon: string
  chapters: { title: string; body: string }[]
}

export const GUIDES: Guide[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    desc: "Unbox, sort, and lay out your build in six clear steps.",
    pages: 12,
    icon: "📦",
    chapters: [
      {
        title: "Unboxing your kit",
        body: "Open the outer sleeve flat and check the parts manifest on the inside lid. Every brikc.it kit is packed by hand and photographed before it ships.",
      },
      {
        title: "Sorting the bricks",
        body: "Tip each numbered bag into its own tray. Sorting by bag before you start saves roughly a third of your build time.",
      },
      {
        title: "Reading the diagrams",
        body: "Each step highlights the new pieces in colour. Work left to right, and don't skip the sub-assemblies.",
      },
      {
        title: "Your first sub-assembly",
        body: "Build the chassis spine first — it's the backbone everything else clips onto. Press firmly until each stud seats.",
      },
      {
        title: "Bodywork and panels",
        body: "Panels are keyed so they only fit one way. If a panel resists, check the orientation rather than forcing it.",
      },
      {
        title: "Final checks",
        body: "Give the finished model a gentle shake test. Anything loose is covered in the Care & Cleaning guide.",
      },
    ],
  },
  {
    id: "framing-guide",
    title: "Framing Guide",
    desc: "Mount, align and hang any brikc.it model safely.",
    pages: 18,
    icon: "🖼️",
    chapters: [
      {
        title: "Choosing a wall",
        body: "Pick a wall out of direct sunlight to keep colours vivid. Interior walls hold fixings best.",
      },
      {
        title: "Marking your fixings",
        body: "Use the paper template included with every frame. A spirit level here saves a crooked frame later.",
      },
      {
        title: "Mounting the model",
        body: "Seat the model on the frame's keyed pins and secure the two hidden clips at the base.",
      },
      {
        title: "Hanging safely",
        body: "Use the rated wall plugs supplied. A 60×90cm framed build weighs about 3.5kg, so fix into masonry or a stud rather than plasterboard alone.",
      },
    ],
  },
  {
    id: "lighting-kit",
    title: "Lighting Kit Setup",
    desc: "Route the backlit halo and set the brightness you want.",
    pages: 9,
    icon: "💡",
    chapters: [
      {
        title: "Routing the halo",
        body: "Clip the LED ribbon into the channel around the inner frame, starting from the bottom-left corner so the join sits out of sight.",
      },
      {
        title: "Connecting power",
        body: "The controller runs from any USB-C source. Route the cable through the notch at the frame base so nothing shows from the front.",
      },
      {
        title: "Setting the brightness",
        body: "Hold the controller button to cycle brightness. Lower settings suit a lit room; the halo is at its best turned down rather than up.",
      },
      {
        title: "Keeping it tidy",
        body: "Tuck the slack behind the frame with the adhesive clips supplied, and leave a small loop at the controller so the cable isn't under tension.",
      },
    ],
  },
  {
    id: "care-cleaning",
    title: "Care & Cleaning",
    desc: "Keep frames dust-free and colours vivid for years.",
    pages: 6,
    icon: "🧼",
    chapters: [
      {
        title: "Routine dusting",
        body: "A soft anti-static brush once a fortnight keeps studs and crevices clear without scratching.",
      },
      {
        title: "Deeper cleans",
        body: "For framed builds, a lightly damp microfibre cloth on the glass is all you need. Never spray directly.",
      },
      {
        title: "Handling loose pieces",
        body: "Re-seat any loose brick with firm thumb pressure. Keep the spare-parts bag from your kit for the rare replacement.",
      },
    ],
  },
]

export function findGuide(id: string): Guide | undefined {
  return GUIDES.find((g) => g.id === id)
}
