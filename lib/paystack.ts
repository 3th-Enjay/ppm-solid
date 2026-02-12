import "server-only"
import crypto from "crypto"
import type { Currency } from "./types"
import { currencyConfig } from "./currency"

export interface PaymentInitialization {
  reference: string
  authorizationUrl: string
  accessCode: string
  currency: Currency
  amount: number
}

export interface PaymentVerification {
  status: "success" | "failed"
  reference: string
  amount: number
  currency: Currency
  paidAt: Date | null
  transactionId?: string
}

const PAYSTACK_BASE_URL = process.env.PAYSTACK_BASE_URL || "https://api.paystack.co"

const currencyDecimals: Record<Currency, number> = {
  NGN: currencyConfig.NGN.decimals,
  USD: currencyConfig.USD.decimals,
  EUR: currencyConfig.EUR.decimals,
  GBP: currencyConfig.GBP.decimals,
}

const currencySymbols: Record<Currency, string> = {
  NGN: currencyConfig.NGN.symbol,
  USD: currencyConfig.USD.symbol,
  EUR: currencyConfig.EUR.symbol,
  GBP: currencyConfig.GBP.symbol,
}

function getSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY
  if (!key) {
    throw new Error("PAYSTACK_SECRET_KEY is not set")
  }
  return key
}

function toSubunit(amount: number, currency: Currency) {
  const decimals = currencyDecimals[currency] ?? 2
  return Math.round(amount * 10 ** decimals)
}

function fromSubunit(amount: number, currency: Currency) {
  const decimals = currencyDecimals[currency] ?? 2
  return amount / 10 ** decimals
}

function generateReference(currency: Currency) {
  return `PC-${currency}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

async function paystackRequest<T>(path: string, options: RequestInit = {}) {
  const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  })

  const data = (await res.json()) as T & { status?: boolean; message?: string }
  if (!res.ok || data?.status === false) {
    const message = data?.message || "Paystack request failed"
    throw new Error(message)
  }
  return data
}

export const paystackService = {
  async initializePayment(params: {
    email: string
    amount: number
    currency: Currency
    reference?: string
    metadata?: Record<string, unknown>
    callbackUrl?: string
    channels?: string[]
  }): Promise<PaymentInitialization> {
    const reference = params.reference || generateReference(params.currency)

    const payload = {
      email: params.email,
      amount: toSubunit(params.amount, params.currency),
      currency: params.currency,
      reference,
      metadata: params.metadata,
      callback_url: params.callbackUrl,
      channels: params.channels,
    }

    const data = await paystackRequest<{
      status: boolean
      data: { authorization_url: string; access_code: string; reference: string }
    }>("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    return {
      reference: data.data.reference,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      currency: params.currency,
      amount: params.amount,
    }
  },

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    const data = await paystackRequest<{
      status: boolean
      data: {
        status: string
        amount: number
        currency: Currency
        reference: string
        paid_at?: string
        paidAt?: string
        id?: string
      }
    }>(`/transaction/verify/${encodeURIComponent(reference)}`)

    const verified = data.data.status === "success"
    const paidAt = data.data.paid_at || data.data.paidAt

    return {
      status: verified ? "success" : "failed",
      reference: data.data.reference,
      amount: fromSubunit(data.data.amount, data.data.currency),
      currency: data.data.currency,
      paidAt: paidAt ? new Date(paidAt) : null,
      transactionId: data.data.id ? String(data.data.id) : undefined,
    }
  },

  async processRefund(params: { reference: string; amount?: number; currency?: Currency }) {
    const payload: Record<string, unknown> = { reference: params.reference }
    if (params.amount && params.currency) {
      payload.amount = toSubunit(params.amount, params.currency)
    }

    await paystackRequest("/refund", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return true
  },

  verifyWebhookSignature(payload: string, signature: string | null) {
    if (!signature) return false
    const hash = crypto
      .createHmac("sha512", getSecretKey())
      .update(payload)
      .digest("hex")
    return hash === signature
  },

  fromSubunit(amount: number, currency: Currency) {
    return fromSubunit(amount, currency)
  },

  toSubunit(amount: number, currency: Currency) {
    return toSubunit(amount, currency)
  },

  formatAmount(amount: number, currency: Currency) {
    const decimals = currencyDecimals[currency] ?? 2
    return `${currencySymbols[currency]}${amount.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`
  },
}
