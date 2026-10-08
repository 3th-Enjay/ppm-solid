import test from "node:test"
import assert from "node:assert/strict"
import { evaluateVerification } from "../../lib/payments/verification"

test("returns completed for successful verification with matching amount/currency/email", () => {
  const result = evaluateVerification({
    verification: {
      status: "success",
      amount: 150000,
      currency: "NGN",
      customerEmail: "student@example.com",
    },
    payment: {
      amount: 150000,
      currency: "NGN",
    },
    userEmail: "student@example.com",
    source: "verify",
  })

  assert.equal(result.targetStatus, "completed")
  assert.deepEqual(result.mismatches, [])
})

test("returns failed when gateway status is not success", () => {
  const result = evaluateVerification({
    verification: {
      status: "failed",
      amount: 150000,
      currency: "NGN",
    },
    payment: {
      amount: 150000,
      currency: "NGN",
    },
    source: "verify",
  })

  assert.equal(result.targetStatus, "failed")
  assert.deepEqual(result.mismatches, [])
})

test("returns manual_review on amount mismatch", () => {
  const result = evaluateVerification({
    verification: {
      status: "success",
      amount: 150001,
      currency: "NGN",
    },
    payment: {
      amount: 150000,
      currency: "NGN",
    },
    source: "webhook",
  })

  assert.equal(result.targetStatus, "manual_review")
  assert.ok(result.reason?.includes("amount mismatch"))
  assert.ok(result.mismatches.includes("amount mismatch"))
})

test("returns manual_review on currency mismatch", () => {
  const result = evaluateVerification({
    verification: {
      status: "success",
      amount: 99,
      currency: "USD",
    },
    payment: {
      amount: 99,
      currency: "NGN",
    },
    source: "reconcile",
  })

  assert.equal(result.targetStatus, "manual_review")
  assert.ok(result.reason?.includes("currency mismatch"))
})

test("treats email match as case-insensitive", () => {
  const result = evaluateVerification({
    verification: {
      status: "success",
      amount: 99,
      currency: "USD",
      customerEmail: "Student@Example.com",
    },
    payment: {
      amount: 99,
      currency: "USD",
    },
    userEmail: "student@example.com",
    source: "admin",
  })

  assert.equal(result.targetStatus, "completed")
  assert.deepEqual(result.mismatches, [])
})

test("returns manual_review on customer email mismatch", () => {
  const result = evaluateVerification({
    verification: {
      status: "success",
      amount: 99,
      currency: "USD",
      customerEmail: "another@example.com",
    },
    payment: {
      amount: 99,
      currency: "USD",
    },
    userEmail: "student@example.com",
    source: "admin",
  })

  assert.equal(result.targetStatus, "manual_review")
  assert.ok(result.reason?.includes("customer email mismatch"))
})
