"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Clock, Award, RotateCcw } from "lucide-react"
import type { QuizAttempt } from "@/lib/types"

interface QuizQuestionView {
  id: string
  question: string
  options: string[]
}

interface MaskedQuiz {
  id: string
  title: string
  passingScore: number
  timeLimit?: number
  questions: QuizQuestionView[]
}

interface QuizRunnerProps {
  courseId: string
  quizId: string
  lessonId?: string
  token?: string | null
  onComplete?: () => void
}

export function QuizRunner({
  courseId,
  quizId,
  lessonId,
  token,
  onComplete,
}: QuizRunnerProps) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [quiz, setQuiz] = useState<MaskedQuiz | null>(null)
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [activeAttempt, setActiveAttempt] = useState<QuizAttempt | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<{
    attempt: QuizAttempt
    passed: boolean
    score: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadQuizAndAttempts()
  }, [quizId, courseId, token])

  const loadQuizAndAttempts = async () => {
    setLoading(true)
    setError(null)
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token || ""}`,
      }

      const [quizRes, attemptsRes] = await Promise.all([
        fetch(`/api/courses/${courseId}/quizzes/${quizId}/attempt?mode=questions`, { headers }),
        fetch(`/api/courses/${courseId}/quizzes/${quizId}/attempt`, { headers }),
      ])

      if (!quizRes.ok) {
        throw new Error("Could not load quiz details")
      }

      const quizData = await quizRes.json()
      setQuiz(quizData.quiz)

      if (attemptsRes.ok) {
        const attemptsData = await attemptsRes.json()
        const userAttempts: QuizAttempt[] = attemptsData.attempts || []
        setAttempts(userAttempts)

        // Find if there is an in-progress attempt to resume
        const inProgress = userAttempts.find((a) => a.status === "in_progress")
        if (inProgress) {
          setActiveAttempt(inProgress)
        } else if (userAttempts.length > 0) {
          // Show the latest attempt result
          const latest = userAttempts[0]
          if (latest.status === "completed") {
            setResult({
              attempt: latest,
              passed: Boolean(latest.passed),
              score: latest.score ?? 0,
            })
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load quiz")
    } finally {
      setLoading(false)
    }
  }

  const startNewAttempt = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/courses/${courseId}/quizzes/${quizId}/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ lessonId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to start quiz attempt")
      }

      const data = await res.json()
      setActiveAttempt(data.attempt)
      setSelectedAnswers({})
      setResult(null)
    } catch (err: any) {
      setError(err.message || "Failed to start quiz")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }))
  }

  const handleSubmit = async () => {
    if (!activeAttempt) return
    setSubmitting(true)
    setError(null)

    try {
      const answersPayload = Object.entries(selectedAnswers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption,
      }))

      const res = await fetch(
        `/api/courses/${courseId}/quizzes/${quizId}/attempt/${activeAttempt.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || ""}`,
          },
          body: JSON.stringify({ answers: answersPayload }),
        },
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to submit quiz attempt")
      }

      const data = await res.json()
      setResult(data)
      setActiveAttempt(null)
      await loadQuizAndAttempts()
      if (data.passed && onComplete) {
        onComplete()
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit answers")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-border/70 p-6">
        <p className="text-sm text-muted-foreground animate-pulse">Loading quiz assessment...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/10 p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      </Card>
    )
  }

  if (!quiz) {
    return (
      <Card className="border-border/70 p-6">
        <p className="text-sm text-muted-foreground">Quiz not found or not published.</p>
      </Card>
    )
  }

  // View completed result
  if (result && !activeAttempt) {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              {quiz.title} — Quiz Result
            </CardTitle>
            <Badge variant={result.passed ? "default" : "destructive"} className="text-sm px-3 py-1">
              {result.passed ? "Passed" : "Needs Retake"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/40 p-4 border flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Your Score</p>
              <p className="text-3xl font-extrabold text-foreground">{result.score}%</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Passing Score</p>
              <p className="text-xl font-bold text-muted-foreground">{quiz.passingScore}%</p>
            </div>
          </div>

          {result.attempt.answers && result.attempt.answers.length > 0 && (
            <div className="space-y-3 mt-4">
              <p className="text-sm font-semibold">Question Breakdown</p>
              {result.attempt.answers.map((ans, idx) => (
                <div
                  key={ans.questionId}
                  className={`p-3 rounded-md border text-sm flex items-start justify-between ${
                    ans.isCorrect
                      ? "border-green-300/50 bg-green-50/50 dark:bg-green-950/20"
                      : "border-red-300/50 bg-red-50/50 dark:bg-red-950/20"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {ans.isCorrect ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <span>Question {idx + 1}</span>
                  </div>
                  <Badge variant={ans.isCorrect ? "outline" : "secondary"}>
                    {ans.isCorrect ? "Correct (+1)" : "Incorrect"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <span className="text-xs text-muted-foreground">
            Total attempts recorded: {attempts.length}
          </span>
          <Button onClick={startNewAttempt} disabled={submitting} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Retake Quiz
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Active quiz runner view
  if (activeAttempt) {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">{quiz.title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3.5 w-3.5" /> In Progress
              </Badge>
              <Badge variant="secondary">Pass mark: {quiz.passingScore}%</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {quiz.questions.map((q, qIndex) => (
            <div key={q.id} className="space-y-3 p-4 rounded-lg border bg-card/60">
              <p className="font-medium text-sm">
                <span className="text-primary mr-2 font-bold">{qIndex + 1}.</span>
                {q.question}
              </p>
              <div className="space-y-2 mt-2">
                {q.options.map((opt, optIndex) => {
                  const isChecked = selectedAnswers[q.id] === optIndex
                  return (
                    <div
                      key={optIndex}
                      className={`flex items-center space-x-3 rounded-md border p-3 cursor-pointer hover:bg-muted/30 transition-colors ${
                        isChecked ? "border-primary bg-primary/5 ring-1 ring-primary/40" : "border-border"
                      }`}
                      onClick={() => handleSelectOption(q.id, optIndex)}
                    >
                      <input
                        type="radio"
                        id={`q-${q.id}-opt-${optIndex}`}
                        name={`q-${q.id}`}
                        checked={isChecked}
                        onChange={() => handleSelectOption(q.id, optIndex)}
                        className="h-4 w-4 text-primary focus:ring-primary border-muted-foreground"
                      />
                      <Label htmlFor={`q-${q.id}-opt-${optIndex}`} className="cursor-pointer flex-1 text-sm">
                        {opt}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <p className="text-xs text-muted-foreground">
            {Object.keys(selectedAnswers).length} of {quiz.questions.length} answered
          </p>
          <Button onClick={handleSubmit} disabled={submitting} className="min-w-32">
            {submitting ? "Grading..." : "Submit Answers"}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Not started view
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold">{quiz.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This quiz contains {quiz.questions.length} questions. You need at least {quiz.passingScore}% to pass this assessment.
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Badge variant="outline">Passing Score: {quiz.passingScore}%</Badge>
          {quiz.timeLimit ? <Badge variant="outline">Time limit: {quiz.timeLimit} mins</Badge> : null}
          <Badge variant="secondary">Attempts: {attempts.length}</Badge>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button onClick={startNewAttempt} disabled={submitting}>
          {attempts.length > 0 ? "Start New Attempt" : "Begin Quiz"}
        </Button>
      </CardFooter>
    </Card>
  )
}
