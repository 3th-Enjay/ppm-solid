"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export type OnboardingPreviewSection = {
  id: string
  title: string
  description?: string
  editLabel?: string
  onEdit?: () => void
  items: Array<{
    label: string
    value: string
  }>
}

export function OnboardingPreview({ sections }: { sections: OnboardingPreviewSection[] }) {
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <Card key={section.id} className="border-primary/10">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">{section.title}</CardTitle>
              {section.description ? <CardDescription>{section.description}</CardDescription> : null}
            </div>
            {section.onEdit ? (
              <Button type="button" variant="ghost" size="sm" onClick={section.onEdit}>
                {section.editLabel || "Edit"}
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            <div className="hidden overflow-hidden rounded-xl border md:block">
              <table className="w-full text-sm">
                <tbody>
                  {section.items.map((item) => (
                    <tr key={item.label} className="border-b last:border-b-0">
                      <th className="w-52 bg-muted/40 px-4 py-3 text-left font-medium text-muted-foreground">
                        {item.label}
                      </th>
                      <td className="px-4 py-3 whitespace-pre-wrap text-foreground">
                        {item.value || "Not provided"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {section.items.map((item) => (
                <div key={item.label} className="rounded-xl border bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{item.value || "Not provided"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}