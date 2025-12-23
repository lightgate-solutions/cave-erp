import type { Currency } from "@/components/marketing/currency-selector";

/**
 * Converts a Nigerian Naira (NGN) price to the selected currency
 * @param ngnPrice - Price in Nigerian Naira (as a number from the string, e.g., 9000 from "₦9,000")
 * @param currency - Target currency object
 * @returns Formatted price string with currency symbol
 */
export function convertPrice(ngnPrice: number, currency: Currency): string {
  if (ngnPrice === 0) {
    return `${currency.symbol}0`;
  }

  const convertedPrice = ngnPrice * currency.rate;

  // Format based on currency type
  if (currency.code === "JPY" || currency.code === "KRW") {
    // Japanese Yen and Korean Won don't use decimals
    return `${currency.symbol}${Math.round(convertedPrice).toLocaleString("en-US")}`;
  }

  // For other currencies, show 2 decimal places with proper formatting
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(convertedPrice);

  return `${currency.symbol}${formatted}`;
}

/**
 * Parses a price string (e.g., "₦9,000" or "₦0") and returns the numeric value
 * @param priceString - Price string with currency symbol
 * @returns Numeric value of the price
 */
export function parseNGNPrice(priceString: string): number {
  // Remove currency symbol and commas, then parse
  const numericValue = priceString.replace(/[₦$,]/g, "").trim();
  return numericValue === "" || numericValue === "0"
    ? 0
    : parseFloat(numericValue);
}
