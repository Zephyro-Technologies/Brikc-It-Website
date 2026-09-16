import { redirect } from "next/navigation"

// The prototype served /frames and /displays from the same component — this
// route only exists so old links to /frames don't 404, and sends visitors on
// to the real page instead of duplicating it.
export default function FramesPage() {
  redirect("/displays")
}
