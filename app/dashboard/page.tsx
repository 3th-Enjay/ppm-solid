"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Award, BookOpen, Clock, Plus, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { MetricCard } from "@/components/skillup/metric-card"
import { fadeUp } from "@/components/skillup/motion-presets"
import { motion } from "framer-motion"
import { useAuthStore } from "@/lib/store"
import type { Course, Enrollment, Payment } from "@/lib/types"
import { formatDuration, formatRelativeTime } from "@/lib/utils/format"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTrainingLocationLabel, ONSITE_TRAINING } from "@/lib/student-registration"
import { OnsiteTrainingBanner } from "@/components/skillup/onsite-training-banner"

type EnrollmentWithCourse = Enrollment & { course: Course | undefined }
type LearningNote = {
  id: string
  content: string
  courseId?: string
  updatedAt: string
  createdAt?: string
}
type DashboardActivity = {
  id: string
  type: string
  title: string
  when: Date
}
type HistoryItem = {
  id: string
  label: string
  when: Date
  courseId?: string
}

const DASHBOARD_FEED_PAGE_SIZE = 8

export default function DashboardPage() {
  const { user, token } = useAuthStore()
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [activities, setActivities] = useState<DashboardActivity[]>([])
  const [notes, setNotes] = useState<LearningNote[]>([])
  const [historyPage, setHistoryPage] = useState(1)
  const [activityPage, setActivityPage] = useState(1)
  const [historyHasMore, setHistoryHasMore] = useState(false)
  const [activityHasMore, setActivityHasMore] = useState(false)
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false)
  const [activityLoadingMore, setActivityLoadingMore] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [noteCourseId, setNoteCourseId] = useState<string>("all")
  const [stats, setStats] = useState({
    totalCourses: 0,
    inProgress: 0,
    completed: 0,
    totalHours: 0,
  })

  
  const [profileCompletion, setProfileCompletion] = useState<number | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const loadProfileCompletion = async () => {
    if (!token || !user || user.role !== "student") return
    setProfileLoading(true)
    try {
      const res = await fetch("/api/onboarding/state", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      if (typeof data?.profileCompletionPercent === "number") {
        setProfileCompletion(data.profileCompletionPercent)
      }
    } catch {
      // no-op
    } finally {
      setProfileLoading(false)
    }
  }

  const loadDashboardBase = async () => {
    if (!user) return
    try {
      const [enrollmentsRes, paymentsRes, historyRes, activityRes] = await Promise.all([
        fetch(`/api/enrollments?userId=${user.id}`),
        fetch(`/api/payments`),
        fetch(`/api/history?userId=${user.id}&page=1&limit=${DASHBOARD_FEED_PAGE_SIZE}`),
        fetch(`/api/activity?userId=${user.id}&page=1&limit=${DASHBOARD_FEED_PAGE_SIZE}`),
      ])
      const data = await enrollmentsRes.json()
      const paymentsData = await paymentsRes.json()
      const historyData = await historyRes.json()
      const activityData = await activityRes.json()
      const enriched = (data.enrollments || []) as EnrollmentWithCourse[]
      const userPayments = ((paymentsData.payments || []) as Payment[]).filter((p) => p.userId === user.id)

      setEnrollments(enriched)
      setPayments(userPayments)
      setHistoryItems(((historyData.history || []) as any[]).map((h) => ({ ...h, when: new Date(h.when) })))
      setActivities(((activityData.activities || []) as any[]).map((a) => ({ ...a, when: new Date(a.when) })))
      setHistoryPage(1)
      setActivityPage(1)
      setHistoryHasMore(Boolean(historyData.pagination?.hasMore))
      setActivityHasMore(Boolean(activityData.pagination?.hasMore))

      const completed = enriched.filter((e) => e.status === "completed").length
      const inProgress = enriched.filter((e) => e.status === "active").length
      const totalMinutes = enriched.reduce((sum, e) => sum + (e.course?.totalDuration || 0), 0)

      setStats({
        totalCourses: enriched.length,
        inProgress,
        completed,
        totalHours: Math.round(totalMinutes / 60),
      })
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
      setEnrollments([])
      setPayments([])
      setHistoryItems([])
      setActivities([])
      setHistoryHasMore(false)
      setActivityHasMore(false)
    }
  }

  useEffect(() => {
    if (!user) return
    void loadDashboardBase()
    void loadProfileCompletion()
  }, [user])

  useEffect(() => {
    if (!user) return
    const loadNotes = async () => {
      try {
        const res = await fetch(`/api/notes?userId=${user.id}`)
        if (!res.ok) {
          setNotes([])
          return
        }
        const data = await res.json()
        setNotes((data.notes || []) as LearningNote[])
      } catch {
        setNotes([])
      }
    }
    loadNotes()
  }, [user])

  const progressTrendData = useMemo(() => {
    return enrollments
      .slice(0, 7)
      .map((enrollment, index) => ({
        name: `C${index + 1}`,
        progress: enrollment.progress,
        durationHours: Math.round((enrollment.course?.totalDuration || 0) / 60),
      }))
  }, [enrollments])

  const statusData = useMemo(
    () => [
      { name: "In Progress", value: stats.inProgress },
      { name: "Completed", value: stats.completed },
      { name: "Pending", value: Math.max(stats.totalCourses - stats.inProgress - stats.completed, 0) },
    ],
    [stats],
  )

  const activeCourses = enrollments.filter((e) => e.status === "active")
  const learningHistory = historyItems
  const lastActivities = activities
  const studentProfile = user?.studentProfile
  const isOnsiteProfile = Boolean(
    studentProfile &&
      (studentProfile.trainingMode === "onsite" ||
        (!studentProfile.trainingMode && (studentProfile.registrationFeeNgn || 0) > 0)),
  )

  const loadMoreHistory = async () => {
    if (!user || historyLoadingMore || !historyHasMore) return
    setHistoryLoadingMore(true)
    try {
      const nextPage = historyPage + 1
      const res = await fetch(`/api/history?userId=${user.id}&page=${nextPage}&limit=${DASHBOARD_FEED_PAGE_SIZE}`)
      if (!res.ok) return
      const data = await res.json()
      const nextItems = ((data.history || []) as any[]).map((h) => ({ ...h, when: new Date(h.when) }))
      setHistoryItems((prev) => [...prev, ...nextItems])
      setHistoryPage(nextPage)
      setHistoryHasMore(Boolean(data.pagination?.hasMore))
    } catch {
      // no-op for now
    } finally {
      setHistoryLoadingMore(false)
    }
  }

  const loadMoreActivities = async () => {
    if (!user || activityLoadingMore || !activityHasMore) return
    setActivityLoadingMore(true)
    try {
      const nextPage = activityPage + 1
      const res = await fetch(`/api/activity?userId=${user.id}&page=${nextPage}&limit=${DASHBOARD_FEED_PAGE_SIZE}`)
      if (!res.ok) return
      const data = await res.json()
      const nextItems = ((data.activities || []) as any[]).map((a) => ({ ...a, when: new Date(a.when) }))
      setActivities((prev) => [...prev, ...nextItems])
      setActivityPage(nextPage)
      setActivityHasMore(Boolean(data.pagination?.hasMore))
    } catch {
      // no-op for now
    } finally {
      setActivityLoadingMore(false)
    }
  }

  const addNote = async () => {
    if (!noteText.trim()) return
    if (!user) return
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          content: noteText.trim(),
          courseId: noteCourseId === "all" ? undefined : noteCourseId,
        }),
      })
      if (!res.ok) return
      const data = await res.json()
      const newNote = data.note as LearningNote
      setNotes((prev) => [newNote, ...prev].slice(0, 30))
      setNoteText("")
      setNoteCourseId("all")
    } catch {
      // no-op for now
    }
  }

  const removeNote = async (id: string) => {
    if (!user) return
    try {
      const res = await fetch(`/api/notes?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(user.id)}`, {
        method: "DELETE",
      })
      if (!res.ok) return
      setNotes((prev) => prev.filter((n) => n.id !== id))
    } catch {
      // no-op for now
    }
  }

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <motion.div variants={fadeUp()} initial="hidden" animate="visible" className="space-y-2">
        <h1 className="text-3xl font-bold md:text-4xl">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground">Track your performance, continue active courses, and monitor your growth.</p>
      </motion.div>

      <OnsiteTrainingBanner />
      {!profileLoading && profileCompletion !== null && profileCompletion < 100 ? (
        <motion.div variants={fadeUp(0.05)} initial="hidden" animate="visible">
          <Card variant="elevated" className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/10">
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Profile completion</p>
                <h2 className="text-xl font-semibold">Complete your learner profile</h2>
                <p className="text-sm text-muted-foreground">Your profile is {profileCompletion}% complete. Finish it to unlock tailored recommendations and a fully guided learner setup.</p>
              </div>
              <Button asChild variant="cta">
                <Link href="/dashboard/profile/setup">Complete profile</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Courses" value={stats.totalCourses} icon={BookOpen} toneClass="text-primary" />
        <MetricCard title="In Progress" value={stats.inProgress} icon={TrendingUp} toneClass="text-amber-500" />
        <MetricCard title="Completed" value={stats.completed} icon={Award} toneClass="text-emerald-500" />
        <MetricCard title="Learning Hours" value={stats.totalHours} icon={Clock} toneClass="text-sky-500" />
      </div>

      {studentProfile && isOnsiteProfile ? (
        <motion.div variants={fadeUp(0.05)} initial="hidden" animate="visible">
          <Card variant="elevated" className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/10">
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">On-site Training</p>
                <h2 className="text-xl font-semibold">{ONSITE_TRAINING.formTitle}</h2>
                <p className="text-sm text-muted-foreground">
                  Location: {getTrainingLocationLabel(studentProfile.preferredLocation)} -{" "}
                  {studentProfile.preferredLocationStartDate}
                </p>
                <p className="text-sm text-muted-foreground">
                  Payment Status: {studentProfile.paymentStatus === "yes" ? "Paid" : "Pending payment"}
                </p>
              </div>
              <Button asChild variant="cta">
                <Link href="/dashboard/profile">View Student Profile</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}
      {studentProfile && !isOnsiteProfile ? (
        <motion.div variants={fadeUp(0.05)} initial="hidden" animate="visible">
          <Card variant="elevated" className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/10">
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Online Training</p>
                <h2 className="text-xl font-semibold">{studentProfile.formTitle}</h2>
                <p className="text-sm text-muted-foreground">Your registration is active. Purchase courses to unlock paid content.</p>
              </div>
              <Button asChild variant="cta">
                <Link href="/courses">Browse Courses</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card variant="elevated" className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Progress Analytics</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]" role="img" aria-label="Progress trend chart for enrolled courses">
            {progressTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressTrendData}>
                  <defs>
                    <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="progress"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#progressFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No enrollment data yet for analytics.
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]" role="img" aria-label="Enrollment status distribution bar chart">
            {statusData.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="var(--accent)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No status data available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card variant="elevated" className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Learning Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Write a quick learning note..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <Select value={noteCourseId} onValueChange={setNoteCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">General note</SelectItem>
                {enrollments.map((e) => (
                  <SelectItem key={e.id} value={e.courseId}>
                    {e.course?.title || e.courseId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="cta" className="w-full" onClick={addNote}>
              <Plus className="mr-2 h-4 w-4" />
              Add Note
            </Button>
            <div className="max-h-56 space-y-2 overflow-auto">
              {notes.length > 0 ? (
                notes.map((note) => (
                  <div key={note.id} className="rounded-xl border border-border/80 bg-card/70 p-3">
                    <p className="text-sm">{note.content}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatRelativeTime(new Date(note.updatedAt))}</span>
                      <button className="hover:text-foreground" onClick={() => removeNote(note.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No notes yet. Add your first learning reminder.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Learning History</CardTitle>
          </CardHeader>
          <CardContent>
            {learningHistory.length > 0 ? (
              <div className="space-y-3">
                {learningHistory.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border/80 bg-card/70 p-3">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(item.when)}</p>
                  </div>
                ))}
                {historyHasMore ? (
                  <Button variant="outline" className="w-full" onClick={loadMoreHistory} disabled={historyLoadingMore}>
                    {historyLoadingMore ? "Loading..." : "Load More"}
                  </Button>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No learning history yet.</p>
            )}
          </CardContent>
        </Card>

        <Card variant="elevated" className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Last Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {lastActivities.length > 0 ? (
              <div className="space-y-3">
                {lastActivities.map((activity) => (
                  <div key={activity.id} className="rounded-xl border border-border/80 bg-card/70 p-3">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(activity.when)}</p>
                  </div>
                ))}
                {activityHasMore ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={loadMoreActivities}
                    disabled={activityLoadingMore}
                  >
                    {activityLoadingMore ? "Loading..." : "Load More"}
                  </Button>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {enrollments.length > 0 ? (
        <Card variant="elevated" className="py-0">
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            {activeCourses.slice(0, 3).map((enrollment) => (
              <div
                key={enrollment.id}
                className="flex flex-col gap-4 rounded-xl border border-border/80 bg-card/70 p-4 md:flex-row md:items-center"
              >
                <img
                  src={enrollment.course?.thumbnail || "/placeholder.svg"}
                  alt={enrollment.course?.title}
                  className="h-20 w-full rounded-lg object-cover md:w-36"
                  loading="lazy"
                  decoding="async"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <h3 className="truncate text-base font-semibold">{enrollment.course?.title}</h3>
                  <div className="text-sm text-muted-foreground">
                    {enrollment.progress}% complete | {formatDuration(enrollment.course?.totalDuration || 0)}
                  </div>
                  <Progress value={enrollment.progress} className="h-2" />
                </div>
                <Button variant="cta" asChild>
                  <Link href={`/dashboard/courses/${enrollment.courseId}/learn`}>Continue</Link>
                </Button>
              </div>
            ))}

            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/courses">View All Courses</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card variant="elevated" className="py-0">
          <CardContent className="p-12 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No courses yet</h3>
            <p className="mb-4 text-muted-foreground">Start your learning journey by enrolling in a course.</p>
            <Button variant="cta" asChild>
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}













