/**
 * The frame finishes a framed build can be mounted in.
 *
 * Hardcoded on purpose: the admin has no screen for these, and they change far
 * less often than the catalogue does. Edit them here.
 *
 * `from` is the cheapest a finish has ever gone out at, in PKR. It is null
 * until someone fills in a real figure — the card simply drops its price line
 * rather than advertising a number nobody has verified. Do not guess these.
 */

export type DisplayFinish = {
  name: string
  /** Material and the frame size it is cut for. */
  finish: string
  from: number | null
  /** A CSS colour or gradient for the swatch block. */
  swatch: string
}

export const DISPLAY_FINISHES: DisplayFinish[] = [
  {
    name: "Matte Black",
    finish: "Aluminium · 60×90cm",
    from: null,
    swatch: "#1c1b1f",
  },
  {
    name: "Walnut Wood",
    finish: "Solid timber · 60×90cm",
    from: null,
    swatch: "#6b4a2b",
  },
  {
    name: "Brushed Silver",
    finish: "Aluminium · 50×70cm",
    from: null,
    swatch: "#c7cacd",
  },
  {
    name: "Backlit LED",
    finish: "Dimmable halo · power lead included",
    from: null,
    swatch: "linear-gradient(135deg,#ff6b2c,#e23a2e)",
  },
]

/** The three promises under the finish grid on /displays. */
export const DISPLAY_PROMISES = [
  {
    title: "Mount-ready",
    body: "Every frame arrives with keyed pins so your model seats straight in — no adhesive, no improvising.",
  },
  {
    title: "Fixings included",
    body: "Wall plugs and a paper template ship in the box, so the frame goes up level first time.",
  },
  {
    title: "Backlight-ready",
    body: "The LED channel is built into the frame, so a halo can be added later without recutting anything.",
  },
]
