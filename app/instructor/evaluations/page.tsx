"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertCircle,
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileCode,
  Github,
  Globe,
  History,
  Layers,
  Search,
  Send,
  User,
} from "lucide-react"
import { useAuthStore } from "@/lib/store"
import type { Course, Grade, GradeHistoryEntry, Rubric, RubricCriterion, RubricScoreItem } from "@/lib/types"

interface DecoratedSubmission {
  id: string
  submissionType: "assignment" | "project"
  targetId: string // assignmentId or projectId
  title: string
  courseId: string
  userId: string
  student: { id: string; name: string; email: string }
  content?: string
  repositoryUrl?: string
  liveDemoUrl?: string
  artifactUrls?: string[]
  status: string
  submittedAt: string | Date
  attemptNumber?: number
  grade?: Grade | null
}

export default function InstructorEvaluationsPage() {
  const { user, token, hydrated } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [submissions, setSubmissions] = useState<DecoratedSubmission[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "graded">("pending")
  const [searchQuery, setSearchQuery] = useState("")

  // Active evaluation modal state
  const [activeSubmission, setActiveSubmission] = useState<DecoratedSubmission | null>(null)
  const [rubric, setRubric] = useState<Rubric | null>(null)
  const [rubricScores, setRubricScores] = useState<Record<string, { points: number; comment: string }>>({})
  const [overallScore, setOverallScore] = useState<number>(0)
  const [maxScore, setMaxScore] = useState<number>(100)
  const [feedback, setFeedback] = useState<string>("")
  const [gradingReason, setGradingReason] = useState<string>("")
  const [gradeHistory, setGradeHistory] = useState<GradeHistoryEntry[]>([])
  const [submittingGrade, setSubmittingGrade] = useState(false)
  const [gradeSuccessMessage, setGradeSuccessMessage] = useState<string>("")
  const [gradeErrorMessage, setGradeErrorMessage] = useState<string>("")

  // Load instructor's courses
  useEffect(() => {
    if (!hydrated || !user) return
    const fetchCourses = async () => {
      setLoadingCourses(true)
      try {
        const res = await fetch(`/api/courses?instructorId=${encodeURIComponent(user.id)}&includeDrafts=true`, {
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        })
        const data = await res.json()
        const userCourses = data.courses || []
        setCourses(userCourses)
        if (userCourses.length > 0) {
          setSelectedCourseId(userCourses[0].id)
        }
      } catch (err) {
        console.error("Failed to load instructor courses:", err)
      } finally {
        setLoadingCourses(false)
      }
    }
    void fetchCourses()
  }, [hydrated, user, token])

  // Load submissions whenever selectedCourseId changes
  useEffect(() => {
    if (!selectedCourseId) {
      setSubmissions([])
      return
    }

    const fetchSubmissions = async () => {
      setLoadingSubmissions(true)
      try {
        const res = await fetch(`/api/courses/${selectedCourseId}/submissions`, {
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        })
        if (!res.ok) {
          setSubmissions([])
          return
        }
        const data = await res.json()

        const unifiedList: DecoratedSubmission[] = []

        // Process assignments
        for (const sub of data.assignmentSubmissions || []) {
          unifiedList.push({
            id: sub.id,
            submissionType: "assignment",
            targetId: sub.assignmentId,
            title: `Assignment (${sub.assignmentId.slice(0, 8)})`,
            courseId: sub.courseId,
            userId: sub.userId,
            student: sub.student,
            content: sub.content,
            artifactUrls: sub.artifactUrls || [],
            status: sub.status,
            submittedAt: sub.submittedAt,
            attemptNumber: sub.attemptNumber,
            grade: sub.grade,
          })
        }

        // Process projects
        for (const sub of data.projectSubmissions || []) {
          unifiedList.push({
            id: sub.id,
            submissionType: "project",
            targetId: sub.projectId,
            title: sub.title || `Capstone Project (${sub.projectId.slice(0, 8)})`,
            courseId: sub.courseId,
            userId: sub.userId,
            student: sub.student,
            content: sub.description,
            repositoryUrl: sub.repositoryUrl,
            liveDemoUrl: sub.liveDemoUrl,
            artifactUrls: (sub.artifacts || []).map((a: any) => a.url).filter(Boolean),
            status: sub.status,
            submittedAt: sub.submittedAt,
            grade: sub.grade,
          })
        }

        // Sort latest submitted first
        unifiedList.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        setSubmissions(unifiedList)
      } catch (err) {
        console.error("Failed to load submissions:", err)
        setSubmissions([])
      } finally {
        setLoadingSubmissions(false)
      }
    }

    void fetchSubmissions()
  }, [selectedCourseId, token])

  // Open evaluation for a submission
  const handleOpenEvaluation = async (sub: DecoratedSubmission) => {
    setActiveSubmission(sub)
    setGradeSuccessMessage("")
    setGradeErrorMessage("")
    setFeedback(sub.grade?.feedback || "")
    setOverallScore(sub.grade?.score ?? 0)
    setMaxScore(sub.grade?.maxScore ?? 100)
    setGradingReason(sub.grade ? "Updated score evaluation" : "Initial academic evaluation")

    // Fetch rubric if available
    try {
      const rubricUrl =
        sub.submissionType === "assignment"
          ? `/api/courses/${sub.courseId}/rubrics?assignmentId=${encodeURIComponent(sub.targetId)}`
          : `/api/courses/${sub.courseId}/rubrics?projectId=${encodeURIComponent(sub.targetId)}`

      const rubricRes = await fetch(rubricUrl, {
        headers: { Authorization: `Bearer ${token || ""}` },
      })
      if (rubricRes.ok) {
        const rubricData = await rubricRes.json()
        setRubric(rubricData.rubric || null)

        // Initialize rubric scores map
        const scoreMap: Record<string, { points: number; comment: string }> = {}
        if (rubricData.rubric?.criteria) {
          rubricData.rubric.criteria.forEach((crit: RubricCriterion) => {
            const existingScore = sub.grade?.rubricScores?.find((rs) => rs.criterionId === crit.id)
            scoreMap[crit.id] = {
              points: existingScore?.points ?? crit.maxPoints,
              comment: existingScore?.comment ?? "",
            }
          })
          setRubricScores(scoreMap)
          if (!sub.grade) {
            const total = Object.values(scoreMap).reduce((sum, item) => sum + item.points, 0)
            setOverallScore(total)
            setMaxScore(rubricData.rubric.totalMaxPoints || 100)
          }
        }
      } else {
        setRubric(null)
      }
    } catch {
      setRubric(null)
    }

    // Fetch grade history if graded
    if (sub.grade) {
      try {
        const gradeRes = await fetch(
          `/api/courses/${sub.courseId}/submissions/${sub.id}/grade?type=${sub.submissionType}`,
          { headers: { Authorization: `Bearer ${token || ""}` } },
        )
        if (gradeRes.ok) {
          const data = await gradeRes.json()
          setGradeHistory(data.history || [])
        }
      } catch {
        setGradeHistory([])
      }
    } else {
      setGradeHistory([])
    }
  }

  // Update a criterion score and re-compute total
  const handleCriterionScoreChange = (critId: string, maxPoints: number, points: number) => {
    const clamped = Math.max(0, Math.min(maxPoints, points))
    setRubricScores((prev) => {
      const next = { ...prev, [critId]: { ...prev[critId], points: clamped } }
      const total = Object.values(next).reduce((sum, item) => sum + (item.points || 0), 0)
      setOverallScore(total)
      return next
    })
  }

  // Submit evaluation
  const handleSubmitEvaluation = async () => {
    if (!activeSubmission) return
    setSubmittingGrade(true)
    setGradeSuccessMessage("")
    setGradeErrorMessage("")

    try {
      const rubricScoresPayload: RubricScoreItem[] = Object.entries(rubricScores).map(
        ([criterionId, val]) => ({
          criterionId,
          points: val.points,
          comment: val.comment?.trim() || undefined,
        }),
      )

      const payload = {
        submissionType: activeSubmission.submissionType,
        studentId: activeSubmission.userId,
        score: overallScore,
        maxScore,
        rubricScores: rubricScoresPayload,
        feedback: feedback.trim() || undefined,
        reason: gradingReason.trim() || "Graded by instructor",
      }

      const res = await fetch(`/api/courses/${activeSubmission.courseId}/submissions/${activeSubmission.id}/grade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to submit evaluation")
      }

      const resData = await res.json()
      setGradeSuccessMessage(`Grade saved successfully (${resData.grade.score}/${resData.grade.maxScore}).`)

      // Update in local state
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === activeSubmission.id
            ? { ...s, status: activeSubmission.submissionType === "project" ? "approved" : "graded", grade: resData.grade }
            : s,
        ),
      )
      setActiveSubmission((prev) => (prev ? { ...prev, grade: resData.grade } : null))
    } catch (err: any) {
      setGradeErrorMessage(err.message || "Failed to save grade")
    } finally {
      setSubmittingGrade(false)
    }
  }

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const isGraded = Boolean(sub.grade)
      if (statusFilter === "pending" && isGraded) return false
      if (statusFilter === "graded" && !isGraded) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesStudent = sub.student.name.toLowerCase().includes(q) || sub.student.email.toLowerCase().includes(q)
        const matchesTitle = sub.title.toLowerCase().includes(q)
        if (!matchesStudent && !matchesTitle) return false
      }

      return true
    })
  }, [submissions, statusFilter, searchQuery])

  const pendingCount = useMemo(() => submissions.filter((s) => !s.grade).length, [submissions])
  const gradedCount = useMemo(() => submissions.filter((s) => Boolean(s.grade)).length, [submissions])

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-600 text-white">Engineering Faculty</Badge>
            <Badge variant="outline" className="border-border/80">Academic Evaluation</Badge>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Evaluation & Grading Workspace
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review student code submissions, verify project deployments, score against academic rubrics, and deliver structured feedback.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/instructor">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {/* Course selector & Summary Bar */}
      <Card variant="elevated">
        <CardContent className="grid gap-4 p-5 md:grid-cols-3 md:items-center">
          <div>
            <Label htmlFor="courseSelect" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select Course
            </Label>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId} disabled={loadingCourses}>
              <SelectTrigger id="courseSelect" className="mt-1.5">
                <SelectValue placeholder={loadingCourses ? "Loading courses..." : "Select a course"} />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title} {course.published ? "(Published)" : "(Draft)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Pending Review</span>
              <Badge variant={pendingCount > 0 ? "default" : "secondary"} className={pendingCount > 0 ? "bg-amber-600 text-white" : ""}>
                {pendingCount}
              </Badge>
            </div>
            <p className="mt-1 text-xl font-bold">{pendingCount} submissions</p>
            <p className="text-xs text-muted-foreground">Student work awaiting faculty review</p>
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Graded & Released</span>
              <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                {gradedCount}
              </Badge>
            </div>
            <p className="mt-1 text-xl font-bold">{gradedCount} completed</p>
            <p className="text-xs text-muted-foreground">Recorded with rubric and feedback history</p>
          </div>
        </CardContent>
      </Card>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={statusFilter === "pending" ? "default" : "outline"}
            onClick={() => setStatusFilter("pending")}
          >
            Pending ({pendingCount})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "graded" ? "default" : "outline"}
            onClick={() => setStatusFilter("graded")}
          >
            Graded ({gradedCount})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
          >
            All ({submissions.length})
          </Button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student or title..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Main Submissions Workspace Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Left: Submissions list */}
        <div className="space-y-3">
          {loadingSubmissions ? (
            <Card>
              <CardContent className="flex items-center justify-center p-12 text-muted-foreground">
                <Clock className="mr-2 h-5 w-5 animate-spin" />
                Loading submissions for this course...
              </CardContent>
            </Card>
          ) : filteredSubmissions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <FileCheck className="mb-3 h-10 w-10 text-muted-foreground/60" />
                <p className="text-base font-semibold text-slate-800 dark:text-slate-200">No submissions found</p>
                <p className="mt-1 text-sm">
                  {statusFilter === "pending"
                    ? "Great job! All submitted work for this course has been evaluated."
                    : "No student submissions match your filter."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredSubmissions.map((sub) => {
              const isSelected = activeSubmission?.id === sub.id
              const hasGrade = Boolean(sub.grade)
              return (
                <Card
                  key={sub.id}
                  className={`cursor-pointer transition-all hover:border-blue-500/80 ${
                    isSelected ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20" : ""
                  }`}
                  onClick={() => handleOpenEvaluation(sub)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={sub.submissionType === "project" ? "default" : "secondary"}>
                            {sub.submissionType === "project" ? "Capstone Project" : "Assignment"}
                          </Badge>
                          {sub.attemptNumber && (
                            <span className="text-xs text-muted-foreground">Attempt #{sub.attemptNumber}</span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(sub.submittedAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <h3 className="mt-1.5 font-semibold text-slate-900 dark:text-slate-100">{sub.title}</h3>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">{sub.student.name}</span>
                          {sub.student.email && <span>({sub.student.email})</span>}
                        </div>
                      </div>

                      <div className="text-right">
                        {hasGrade ? (
                          <div>
                            <Badge className="bg-emerald-600 text-white">
                              {sub.grade?.score} / {sub.grade?.maxScore}
                            </Badge>
                            <p className="mt-1 text-[11px] font-medium text-emerald-600">Evaluated</p>
                          </div>
                        ) : (
                          <div>
                            <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300">
                              Needs Grading
                            </Badge>
                            <p className="mt-1 text-[11px] text-muted-foreground">Action required</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preview snippets */}
                    {sub.repositoryUrl || sub.liveDemoUrl ? (
                      <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-border/60 text-xs">
                        {sub.repositoryUrl && (
                          <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <Github className="h-3 w-3" /> Code Repository
                          </span>
                        )}
                        {sub.liveDemoUrl && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <Globe className="h-3 w-3" /> Live Demo
                          </span>
                        )}
                      </div>
                    ) : sub.content ? (
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                        {sub.content}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Right: Active Evaluation Panel */}
        <div>
          {activeSubmission ? (
            <Card variant="elevated" className="sticky top-6 border-blue-200 dark:border-blue-900/60 shadow-lg">
              <CardHeader className="border-b border-border/70 pb-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-blue-600 text-white">
                    {activeSubmission.submissionType === "project" ? "Capstone Evaluation" : "Assignment Evaluation"}
                  </Badge>
                  {activeSubmission.grade ? (
                    <Badge variant="outline" className="border-emerald-400 text-emerald-600">
                      Score: {activeSubmission.grade.score}/{activeSubmission.grade.maxScore}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Un-graded</Badge>
                  )}
                </div>
                <CardTitle className="mt-2 text-xl">{activeSubmission.title}</CardTitle>
                <CardDescription>
                  Submitted by <strong className="text-slate-800 dark:text-slate-200">{activeSubmission.student.name}</strong> on{" "}
                  {new Date(activeSubmission.submittedAt).toLocaleString()}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 p-5 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Artifacts and Links */}
                {(activeSubmission.repositoryUrl || activeSubmission.liveDemoUrl || (activeSubmission.artifactUrls && activeSubmission.artifactUrls.length > 0)) && (
                  <div className="space-y-2 rounded-xl border border-border/80 bg-muted/20 p-3.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Submitted Engineering Artifacts
                    </Label>
                    <div className="flex flex-col gap-2 pt-1 text-sm">
                      {activeSubmission.repositoryUrl && (
                        <a
                          href={activeSubmission.repositoryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-2 text-blue-600 hover:underline dark:text-blue-400"
                        >
                          <span className="flex items-center gap-2">
                            <Github className="h-4 w-4" />
                            GitHub Repository
                          </span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {activeSubmission.liveDemoUrl && (
                        <a
                          href={activeSubmission.liveDemoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-2 text-emerald-600 hover:underline dark:text-emerald-400"
                        >
                          <span className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Live Deployment URL
                          </span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {(activeSubmission.artifactUrls || []).map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-2 text-slate-700 hover:underline dark:text-slate-300"
                        >
                          <span className="flex items-center gap-2 truncate">
                            <FileCode className="h-4 w-4 shrink-0" />
                            <span className="truncate">{url}</span>
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Text Content */}
                {activeSubmission.content && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Written Response / Solution
                    </Label>
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-3 text-sm whitespace-pre-wrap font-mono text-xs">
                      {activeSubmission.content}
                    </div>
                  </div>
                )}

                {/* Rubric Evaluation Form */}
                {rubric && rubric.criteria && rubric.criteria.length > 0 ? (
                  <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-blue-600" />
                        Rubric Criteria Scoring ({rubric.title})
                      </Label>
                      <span className="text-xs font-bold text-blue-600">
                        {overallScore} / {rubric.totalMaxPoints} pts
                      </span>
                    </div>

                    <div className="space-y-3 pt-1">
                      {rubric.criteria.map((crit) => {
                        const current = rubricScores[crit.id] || { points: crit.maxPoints, comment: "" }
                        return (
                          <div key={crit.id} className="rounded-lg border border-border/80 bg-card p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-sm">{crit.title}</p>
                                {crit.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{crit.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Input
                                  type="number"
                                  min={0}
                                  max={crit.maxPoints}
                                  value={current.points}
                                  onChange={(e) =>
                                    handleCriterionScoreChange(crit.id, crit.maxPoints, Number(e.target.value) || 0)
                                  }
                                  className="w-16 h-8 text-center text-sm font-bold"
                                />
                                <span className="text-xs text-muted-foreground">/ {crit.maxPoints}</span>
                              </div>
                            </div>
                            <Input
                              placeholder={`Feedback for ${crit.title}...`}
                              value={current.comment}
                              onChange={(e) =>
                                setRubricScores((prev) => ({
                                  ...prev,
                                  [crit.id]: { ...prev[crit.id], comment: e.target.value },
                                }))
                              }
                              className="h-7 text-xs"
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 rounded-xl border border-border/80 bg-muted/20 p-4">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Direct Score Assessment
                    </Label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={maxScore}
                          value={overallScore}
                          onChange={(e) => setOverallScore(Number(e.target.value) || 0)}
                          className="w-24 text-lg font-bold"
                        />
                        <span className="text-sm text-muted-foreground">/ {maxScore} points</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Instructor Feedback */}
                <div className="space-y-1.5">
                  <Label htmlFor="evalFeedback" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Instructor Feedback & Recommendations
                  </Label>
                  <Textarea
                    id="evalFeedback"
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide constructive feedback on code quality, architecture, edge cases, and best practices..."
                    className="text-sm"
                  />
                </div>

                {/* Audit reason */}
                <div className="space-y-1.5">
                  <Label htmlFor="gradingReason" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Evaluation Reason / Audit Note
                  </Label>
                  <Input
                    id="gradingReason"
                    value={gradingReason}
                    onChange={(e) => setGradingReason(e.target.value)}
                    placeholder="e.g. Initial rubric grading, re-evaluation upon revision"
                    className="h-8 text-xs"
                  />
                </div>

                {/* Feedback Alerts */}
                {gradeSuccessMessage && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{gradeSuccessMessage}</span>
                  </div>
                )}
                {gradeErrorMessage && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{gradeErrorMessage}</span>
                  </div>
                )}

                {/* Submit Evaluation Button */}
                <Button
                  onClick={handleSubmitEvaluation}
                  disabled={submittingGrade}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {submittingGrade ? "Saving Grade & Feedback..." : activeSubmission.grade ? "Update Grade & Feedback" : "Submit Grade & Feedback"}
                </Button>

                {/* Grade History Audit Trail */}
                {gradeHistory.length > 0 && (
                  <div className="border-t border-border/80 pt-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <History className="h-3.5 w-3.5" />
                      Immutable Grade History ({gradeHistory.length})
                    </div>
                    <div className="space-y-2">
                      {gradeHistory.map((h) => (
                        <div key={h.id} className="rounded-lg border border-border/60 bg-muted/10 p-2.5 text-xs space-y-1">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>{new Date(h.createdAt).toLocaleString()}</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {h.previousScore} → {h.newScore} pts
                            </span>
                          </div>
                          {h.reason && <p className="text-muted-foreground italic">Reason: {h.reason}</p>}
                          {h.newFeedback && <p className="text-slate-700 dark:text-slate-300">"{h.newFeedback}"</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed p-12 text-center text-muted-foreground">
              <Award className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-semibold">Select a submission to evaluate</p>
              <p className="mt-1 text-sm">
                Choose an assignment or capstone project submission from the list to review code artifacts and enter rubric scores.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
