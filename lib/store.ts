// Global state management with Zustand
import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, CartItem, Currency } from "./types"

interface AuthState {
  user: User | null
  token: string | null
  hydrated: boolean
  lastLogin: { email: string; name: string; role: User["role"] } | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  setHydrated: (value: boolean) => void
  clearLastLogin: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      hydrated: false,
      lastLogin: null,
      setAuth: (user, token) =>
        set({
          user,
          token,
          hydrated: true,
          lastLogin: { email: user.email, name: user.name, role: user.role },
        }),
      clearAuth: () =>
        set((state) => ({
          user: null,
          token: null,
          hydrated: true,
          lastLogin: state.lastLogin,
        })),
      setHydrated: (value) => set({ hydrated: value }),
      clearLastLogin: () => set({ lastLogin: null }),
      isAuthenticated: () => !!get().token,
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    },
  ),
)

interface CartState {
  items: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (courseId: string) => void
  clearCart: () => void
  getTotal: (currency: Currency) => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addToCart: (item) => {
        const items = get().items
        const exists = items.find((i) => i.courseId === item.courseId)
        if (!exists) {
          set({ items: [...items, item] })
        }
      },
      removeFromCart: (courseId) => {
        set({ items: get().items.filter((i) => i.courseId !== courseId) })
      },
      clearCart: () => set({ items: [] }),
      getTotal: (currency) => {
        return get().items.reduce((total, item) => total + item.course.price[currency], 0)
      },
    }),
    {
      name: "cart-storage",
    },
  ),
)

interface PreferencesState {
  currency: Currency
  currencySelected: boolean
  setCurrency: (currency: Currency) => void
  setCurrencySelected: (selected: boolean) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      currency: "USD",
      currencySelected: false,
      setCurrency: (currency) => set({ currency }),
      setCurrencySelected: (selected) => set({ currencySelected: selected }),
    }),
    {
      name: "preferences-storage",
    },
  ),
)
