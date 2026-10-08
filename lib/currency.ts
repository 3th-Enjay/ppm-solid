import type { Currency } from "./types"

export const currencyConfig: Record<Currency, { symbol: string; name: string; decimals: number }> = {
  NGN: { symbol: "₦", name: "Nigerian Naira", decimals: 2 },
  USD: { symbol: "$", name: "US Dollar", decimals: 2 },
  EUR: { symbol: "€", name: "Euro", decimals: 2 },
  GBP: { symbol: "£", name: "British Pound", decimals: 2 },
}

