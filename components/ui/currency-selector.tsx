'use client'

import { usePreferencesStore } from '@/lib/store'
import { currencyConfig } from '@/lib/currency'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Currency } from '@/lib/types'

export function CurrencySelector() {
  const { currency, setCurrency } = usePreferencesStore()

  const currencies: Currency[] = ['USD', 'NGN', 'EUR', 'GBP']

  return (
    <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
      <SelectTrigger className="w-fit gap-2 bg-transparent border-0 px-2">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {currencies.map((curr) => (
          <SelectItem key={curr} value={curr} className="cursor-pointer">
            <span className="font-medium">
              {currencyConfig[curr].symbol} {curr}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

