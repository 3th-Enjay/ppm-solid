"use client"

import { useState } from "react"
import { Loader2, ShieldAlert } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface AdminActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  executeAction: (note?: string) => Promise<void>
  cancelLabel?: string
  warningBadge?: string
  secondaryDescription?: string
  noteLabel?: string
  notePlaceholder?: string
  noteRequired?: boolean
  successToast?: string
  errorToast?: string
}

export function AdminActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  executeAction,
  cancelLabel = "Cancel",
  warningBadge,
  secondaryDescription,
  noteLabel,
  notePlaceholder = "Enter details...",
  noteRequired = false,
  successToast = "Action completed successfully.",
  errorToast = "Action failed. Please try again.",
}: AdminActionDialogProps) {
  const { toast } = useToast()
  const [pending, setPending] = useState(false)
  const [note, setNote] = useState("")

  const closeAndReset = () => {
    onOpenChange(false)
    setNote("")
  }

  const handleConfirm = async () => {
    if (noteRequired && !note.trim()) {
      toast({
        title: "Validation error",
        description: "This action requires a note.",
        variant: "destructive",
      })
      return
    }

    setPending(true)
    try {
      await executeAction(note.trim() || undefined)
      toast({
        title: "Success",
        description: successToast,
      })
      closeAndReset()
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error?.message || errorToast,
        variant: "destructive",
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (pending) return
        if (!nextOpen) {
          setNote("")
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2">
          {warningBadge ? (
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="inline-flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" />
                {warningBadge}
              </Badge>
            </div>
          ) : null}
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          {secondaryDescription ? (
            <p className="text-sm text-muted-foreground">{secondaryDescription}</p>
          ) : null}
        </DialogHeader>

        {noteLabel ? (
          <div className="space-y-2">
            <Label htmlFor="admin-action-note">{noteLabel}</Label>
            <Textarea
              id="admin-action-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={notePlaceholder}
              disabled={pending}
              className="min-h-28"
            />
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={closeAndReset} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {pending ? "Processing..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
