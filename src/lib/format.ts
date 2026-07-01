export function formatPrice(price: number | null | undefined, currency = "USD"): string | null {
  if (price == null) return null;
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : `${currency} `;
  return `From ${symbol}${price}`;
}
