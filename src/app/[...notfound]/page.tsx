import Home from "../page"

// Mirrors the original router's `<Route path="*" element={<Home />} />` catch-all:
// any unmatched URL renders the home page.
export default function CatchAllPage() {
  return <Home />
}
