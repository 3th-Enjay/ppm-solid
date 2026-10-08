import { currencyConfig } from "./currency"
import type { Currency } from "./types"

export function formatPrice(amount: number, currency: Currency): string {
  const config = currencyConfig[currency]
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  })
  return `${config.symbol}${formatted}`
}

export function getPriceInCurrency(prices: Record<Currency, number>, currency: Currency): number {
  return prices[currency] || prices.USD // Fallback to USD if currency not available
}
