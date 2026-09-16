/**
 * Rupees, no decimals — the store doesn't price in paisa.
 *
 * Deliberately NOT in `src/cart.tsx`: that file is a client component, so
 * importing this from it made every Server Component that formatted a price
 * fail at render with "Attempted to call money() from the server". Formatting
 * has nothing to do with the cart, and both sides need it.
 */
export const money = (n: number) => `Rs ${Math.round(n).toLocaleString("en-PK")}`
