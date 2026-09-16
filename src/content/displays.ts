/**
 * Page furniture for /displays that has no admin screen.
 *
 * The finishes themselves are ordinary catalogue products now (kind:
 * "display") — see `getDisplays()` / `getDisplay()` in `src/lib/shop.ts`.
 * What's left here is copy fixed to the page layout rather than something
 * the admin edits.
 */

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
