"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

type VerifyAction = "check" | "approve" | "reject" | "fraudulent"

export default function AdminPaymentVerifyPage() {
  const { token } = useAuthStore()
  const [reference, setReference] = useState("")
  const [note, setNote] = useState("")
  const [loadingAction, setLoadingAction] = useState<VerifyAction | null>(null)
  const [reconcileLoading, setReconcileLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [reconcileResult, setReconcileResult] = useState<any>(null)
  const [error, setError] = useState("")

  const runAction = async (action: VerifyAction) => {
    if (!reference.trim() || !token) return
    setError("")
    setLoadingAction(action)
    try {
      const res = await fetch("/api/admin/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reference: reference.trim(),
          action,
          note: note.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Action failed")
      }
      setResult(data)
    } catch (err: any) {
      setError(err?.message || "Action failed")
      setResult(null)
    } finally {
      setLoadingAction(null)
    }
  }

  const runReconciliation = async () => {
    if (!token) return
    setError("")
    setReconcileLoading(true)
    try {
      const res = await fetch("/api/payments/reconcile?olderThanMinutes=30&limit=200", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Reconciliation failed")
      }
      setReconcileResult(data)
    } catch (err: any) {
      setError(err?.message || "Reconciliation failed")
      setReconcileResult(null)
    } finally {
      setReconcileLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Manual Payment Verification</h1>
          <p className="mt-2 text-muted-foreground">
            Verify Paystack reference and apply admin override actions.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/payments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Payments
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verify Reference</CardTitle>
          <CardDescription>Run check, approve, reject, or mark as fraudulent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reference">Transaction Reference</Label>
            <Input
              id="reference"
              placeholder="e.g. PC-NGN-1738373737-XA92"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Admin Note (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for reject/fraudulent action..."
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => runAction("check")} disabled={!reference.trim() || Boolean(loadingAction)}>
              {loadingAction === "check" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Check
            </Button>
            <Button onClick={() => runAction("approve")} disabled={!reference.trim() || Boolean(loadingAction)}>
              {loadingAction === "approve" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Approve
            </Button>
            <Button variant="destructive" onClick={() => runAction("reject")} disabled={!reference.trim() || Boolean(loadingAction)}>
              {loadingAction === "reject" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Reject
            </Button>
            <Button variant="secondary" onClick={() => runAction("fraudulent")} disabled={!reference.trim() || Boolean(loadingAction)}>
              {loadingAction === "fraudulent" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Mark Fraudulent
            </Button>
          </div>
          {error ? (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <ShieldAlert className="h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Payment Reconciliation</CardTitle>
          <CardDescription>
            Scans stale pending/processing payments older than 30 minutes and reconciles with Paystack.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={runReconciliation} disabled={reconcileLoading}>
            {reconcileLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Run Reconciliation
          </Button>
          {reconcileResult?.summary ? (
            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
              <Badge variant="outline">Scanned: {reconcileResult.summary.scanned}</Badge>
              <Badge variant="outline">Completed: {reconcileResult.summary.completed}</Badge>
              <Badge variant="outline">Failed: {reconcileResult.summary.failed}</Badge>
              <Badge variant="outline">Manual: {reconcileResult.summary.manualReview}</Badge>
              <Badge variant="outline">Errors: {reconcileResult.summary.errors}</Badge>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Result
              {result?.payment?.status ? <Badge variant="outline">{result.payment.status}</Badge> : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><span className="text-muted-foreground">Action:</span> {result.action || "check"}</p>
            {result?.mismatches?.length ? (
              <p><span className="text-muted-foreground">Mismatches:</span> {result.mismatches.join(", ")}</p>
            ) : null}
            <pre className="overflow-x-auto rounded-md border bg-muted/30 p-3 text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
