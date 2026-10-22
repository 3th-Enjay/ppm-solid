"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, FolderGit2, Globe, Send, Award } from "lucide-react"
import type { Project, ProjectSubmission, Grade } from "@/lib/types"

interface CapstoneProjectPanelProps {
  courseId: string
  token?: string | null
}

export function CapstoneProjectPanel({ courseId, token }: CapstoneProjectPanelProps) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [grade, setGrade] = useState<Grade | null>(null)

  // Form fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [repositoryUrl, setRepositoryUrl] = useState("")
  const [liveDemoUrl, setLiveDemoUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    loadProjects()
  }, [courseId, token])

  const loadProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/courses/${courseId}/projects`, {
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      })

      if (!res.ok) {
        throw new Error("Could not load capstone projects")
      }

      const data = await res.json()
      const projs: Project[] = data.projects || []
      const subs: ProjectSubmission[] = data.submissions || []
      setProjects(projs)
      setSubmissions(subs)

      if (projs.length > 0) {
        const first = projs[0]
        setSelectedProject(first)

        const userSub = subs.find((s) => s.projectId === first.id)
        if (userSub) {
          setTitle(userSub.title)
          setDescription(userSub.description || "")
          setRepositoryUrl(userSub.repositoryUrl || "")
          setLiveDemoUrl(userSub.liveDemoUrl || "")

          // Fetch grade if any
          const gradeRes = await fetch(
            `/api/courses/${courseId}/submissions/${userSub.id}/grade?type=project`,
            { headers: { Authorization: `Bearer ${token || ""}` } },
          )
          if (gradeRes.ok) {
            const gradeData = await gradeRes.json()
            if (gradeData.grade) {
              setGrade(gradeData.grade)
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load capstone projects")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return

    if (!title.trim()) {
      setError("Project title is required")
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await fetch(`/api/courses/${courseId}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          title: title.trim(),
          description: description.trim(),
          repositoryUrl: repositoryUrl.trim(),
          liveDemoUrl: liveDemoUrl.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to submit project")
      }

      setSuccessMsg("Capstone project submitted successfully!")
      await loadProjects()
    } catch (err: any) {
      setError(err.message || "Failed to submit project")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-border/70 p-6">
        <p className="text-sm text-muted-foreground animate-pulse">Loading capstone project requirements...</p>
      </Card>
    )
  }

  if (projects.length === 0) {
    return (
      <Card className="border-border/70 p-6">
        <p className="text-sm text-muted-foreground">No capstone projects are configured for this course yet.</p>
      </Card>
    )
  }

  const currentSubmission = submissions.find((s) => s.projectId === selectedProject?.id)

  return (
    <div className="space-y-6">
      {/* Project Overview */}
      {selectedProject && (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <FolderGit2 className="h-5 w-5 text-primary" />
                {selectedProject.title}
              </CardTitle>
              <Badge variant="outline">Max Score: {selectedProject.maxScore} pts</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground whitespace-pre-wrap">{selectedProject.description}</p>
            {selectedProject.instructions && (
              <div className="bg-muted/40 p-3.5 rounded-lg border space-y-1">
                <p className="font-semibold text-xs text-muted-foreground uppercase">Instructions & Guidelines</p>
                <p className="whitespace-pre-wrap text-foreground">{selectedProject.instructions}</p>
              </div>
            )}
            {selectedProject.dueDate && (
              <p className="text-xs text-muted-foreground">
                Due date: {new Date(selectedProject.dueDate).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grade Banner */}
      {grade && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Capstone Evaluation & Grade
              </CardTitle>
              <Badge className="text-sm px-3 py-1">
                Score: {grade.score} / {grade.maxScore || selectedProject?.maxScore || 100}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {grade.feedback && (
              <div>
                <p className="font-medium text-xs text-muted-foreground uppercase">Instructor Feedback</p>
                <p className="mt-1 whitespace-pre-wrap text-foreground bg-background/80 p-3 rounded-md border">
                  {grade.feedback}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submission Form */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">
              {currentSubmission ? "Your Project Submission" : "Submit Capstone Project"}
            </CardTitle>
            {currentSubmission && (
              <Badge variant={currentSubmission.status === "approved" ? "default" : "secondary"} className="capitalize">
                {currentSubmission.status.replace("_", " ")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="proj-title">Project Title</Label>
              <Input
                id="proj-title"
                placeholder="e.g. Full-Stack LMS Platform"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proj-desc">Project Overview & Documentation</Label>
              <Textarea
                id="proj-desc"
                rows={4}
                placeholder="Describe your implementation, architecture, features, and how to test..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="repo-url" className="flex items-center gap-1.5">
                  <FolderGit2 className="h-4 w-4 text-muted-foreground" />
                  Code Repository URL
                </Label>
                <Input
                  id="repo-url"
                  placeholder="https://github.com/username/repo"
                  value={repositoryUrl}
                  onChange={(e) => setRepositoryUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="demo-url" className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  Live Demo / Deployment URL
                </Label>
                <Input
                  id="demo-url"
                  placeholder="https://my-app.vercel.app"
                  value={liveDemoUrl}
                  onChange={(e) => setLiveDemoUrl(e.target.value)}
                />
              </div>
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
              {submitting ? "Submitting..." : currentSubmission ? "Update Project Submission" : "Submit Capstone"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
