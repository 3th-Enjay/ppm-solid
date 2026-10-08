"use client"

import type { ReactNode } from "react"

type Column = {
  key: string
  title: string
  className?: string
}

interface AdminDataTableProps {
  columns: Column[]
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  children: ReactNode
}

export function AdminDataTable({
  columns,
  loading = false,
  error = null,
  emptyMessage = "No data found.",
  children,
}: AdminDataTableProps) {
  if (loading) {
    return <div className="rounded-lg border p-6 text-sm text-muted-foreground">Loading data...</div>
  }

  if (error) {
    return <div className="rounded-lg border border-destructive/40 p-6 text-sm text-destructive">{error}</div>
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            {columns.map((column) => (
              <th key={column.key} className={`p-3 text-left font-semibold ${column.className || ""}`}>
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children || <tr><td className="p-6 text-muted-foreground">{emptyMessage}</td></tr>}</tbody>
      </table>
    </div>
  )
}
