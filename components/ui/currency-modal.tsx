"use client"

import { useEffect, useState } from "react"
import { usePreferencesStore } from "@/lib/store"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"

const CURRENCIES = [
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "USD", name: "United States Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
]

export function CurrencyModal() {
  const { currency, currencySelected, setCurrency, setCurrencySelected } = usePreferencesStore()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      // Check persisted preferences-storage to decide if modal already shown
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("preferences-storage") : null
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && parsed.state && parsed.state.currencySelected) {
          setOpen(false)
          return
        }
      }
    } catch (err) {
      // ignore
    }
    // Show modal if currency hasn't been selected yet
    if (!currencySelected) {
      setOpen(true)
    }
  }, [currencySelected])

  const handleSelectCurrency = (code: string) => {
    setCurrency(code as "NGN" | "USD" | "EUR" | "GBP")
    setCurrencySelected(true)
    setOpen(false)
  }

  if (!mounted) return null

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="mx-auto w-full max-w-md p-6">
          <SheetHeader className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <Globe className="h-12 w-12 text-primary" />
            </div>
            <SheetTitle className="text-2xl">Select Your Currency</SheetTitle>
            <SheetDescription className="text-base mt-2">
              Choose your preferred currency for displaying course prices throughout the platform.
            </SheetDescription>
          </SheetHeader>

          <div className="grid grid-cols-1 gap-3 py-6">
            {CURRENCIES.map((curr) => (
              <Button
                key={curr.code}
                onClick={() => handleSelectCurrency(curr.code)}
                variant={currency === curr.code ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-start justify-start text-left"
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="text-2xl font-bold text-primary">{curr.symbol}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{curr.name}</p>
                    <p className="text-sm opacity-75">{curr.code}</p>
                  </div>
                  {currency === curr.code && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </Button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => handleSelectCurrency(currency)}
              className="flex-1"
              disabled={!currencySelected && currency === "USD"}
            >
              Continue with {CURRENCIES.find((c) => c.code === currency)?.code}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

