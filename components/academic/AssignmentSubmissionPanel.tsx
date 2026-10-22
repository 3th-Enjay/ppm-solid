"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Clock, FileText, Send, Plus, Trash2, Award } from "lucide-react"
import type { AssignmentSubmission, Grade } from "@/lib/types"

interface AssignmentSubmissionPanelProps {
  courseId: string
  assignmentId: string
  lessonId?: string
  token?: string | null
  maxScore?: number
  onSubmitted?: () => void
}

export function AssignmentSubmissionPanel({
  courseId,
  assignmentId,
  lessonId,
  token,
  maxScore = 100,
  onSubmitted,
}: AssignmentSubmissionPanelProps) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([])
  const [grade, setGrade] = useState<Grade | null>(null)
  const [content, setContent] = useState("")
  const [artifactUrls, setArtifactUrls] = useState<string[]>([])
  const [newUrl, setNewUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    loadSubmissions()
  }, [courseId, assignmentId, token])

  const loadSubmissions = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/courses/${courseId}/assignments/${assignmentId}/submissions`, {
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      })

      if (!res.ok) {
        throw new Error("Could not load submissions")
      }

      const data = await res.json()
      const list: AssignmentSubmission[] = data.submissions || []
      setSubmissions(list)

      if (list.length > 0) {
        // Load grade for the latest submission
        const latest = list[0]
        const gradeRes = await fetch(
          `/api/courses/${courseId}/submissions/${latest.id}/grade?type=assignment`,
          {
            headers: { Authorization: `Bearer ${token || ""}` },
          },
        )
        if (gradeRes.ok) {
          const gradeData = await gradeRes.json()
          if (gradeData.grade) {
            setGrade(gradeData.grade)
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load submissions")
    } finally {
      setLoading(false)
    }
  }

  const addArtifactUrl = () => {
    if (!newUrl.trim()) return
    setArtifactUrls((prev) => [...prev, newUrl.trim()])
    setNewUrl("")
  }

  const removeArtifactUrl = (index: number) => {
    setArtifactUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && artifactUrls.length === 0) {
      setError("Please provide either written submission text or artifact links")
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await fetch(`/api/courses/${courseId}/assignments/${assignmentId}/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({
          content: content.trim(),
          artifactUrls,
          lessonId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to submit assignment")
      }

      setContent("")
      setArtifactUrls([])
      setSuccessMsg("Assignment submitted successfully!")
      await loadSubmissions()
      if (onSubmitted) {
        onSubmitted()
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit assignment")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-border/70 p-6">
        <p className="text-sm text-muted-foreground animate-pulse">Loading assignment submissions...</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Latest Grade Banner if Available */}
      {grade && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Instructor Grade & Feedback
              </CardTitle>
              <Badge className="text-sm px-3 py-1">
                Score: {grade.score} / {grade.maxScore || maxScore}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {grade.feedback && (
              <div>
                <p className="font-medium text-xs text-muted-foreground uppercase">Instructor Comments</p>
                <p className="mt-1 whitespace-pre-wrap text-foreground bg-background/80 p-3 rounded-md border">
                  {grade.feedback}
                </p>
              </div>
            )}
            {grade.rubricScores && grade.rubricScores.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="font-medium text-xs text-muted-foreground uppercase">Rubric Criteria Breakdown</p>
                <div className="space-y-1.5">
                  {grade.rubricScores.map((rs, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2 rounded bg-muted/40 border">
                      <span>Criterion {idx + 1}{rs.comment ? `: ${rs.comment}` : ""}</span>
                      <span className="font-semibold">{rs.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submission Form */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {submissions.length > 0 ? "Submit Revised Work" : "Submit Assignment"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Your Solution or Written Response</Label>
              <Textarea
                id="content"
                rows={5}
                placeholder="Enter your written submission, reflection, or notes here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label>Artifact & Project Links (GitHub, Figma, Google Docs, etc.)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://github.com/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addArtifactUrl()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addArtifactUrl} className="shrink-0 gap-1">
                  <Plus className="h-4 w-4" /> Add Link
                </Button>
              </div>

              {artifactUrls.length > 0 && (
                <div className="space-y-2 pt-2">
                  {artifactUrls.map((url, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/50 border">
                      <a href={url} target="_blank" rel="noreferrer" className="text-primary underline truncate max-w-md">
                        {url}
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArtifactUrl(idx)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 dark:bg-green-950/20 p-3 rounded-md text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <Button type="submit" disabled={submitting} className="w-full gap-2">
              <Send className="h-4 w-4" />
              {submitting ? "Submitting..." : submissions.length > 0 ? "Submit New Attempt" : "Submit Assignment"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Submission History */}
      {submissions.length > 0 && (
        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Submission History ({submissions.length} attempts recorded)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {submissions.map((sub) => (
              <div key={sub.id} className="p-3.5 rounded-lg border bg-muted/20 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Attempt #{sub.attemptNumber}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={sub.status === "graded" ? "default" : "outline"} className="capitalize">
                      {sub.status}
                    </Badge>
                    <span className="text-muted-foreground">
                      {new Date(sub.submittedAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {sub.content && (
                  <p className="text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                    {sub.content}
                  </p>
                )}

                {sub.artifactUrls && sub.artifactUrls.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {sub.artifactUrls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block px-2 py-0.5 rounded bg-background border text-primary underline truncate max-w-xs"
                      >
                        {url}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
