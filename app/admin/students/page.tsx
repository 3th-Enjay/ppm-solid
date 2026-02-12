"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Mail, BookOpen, Award, Ban, CheckCircle, Users } from "lucide-react"
import type { User, Enrollment, Course } from "@/lib/types"
import { formatDate } from "@/lib/utils/format"
import { useAuthStore } from "@/lib/store"

export default function AdminStudentsPage() {
  const { token } = useAuthStore()
  const [students, setStudents] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredStudents, setFilteredStudents] = useState<User[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [coursesById, setCoursesById] = useState<Record<string, Course>>({})

  useEffect(() => {
    const loadData = async () => {
      if (!token) return
      try {
        const [studentsRes, enrollmentsRes, coursesRes] = await Promise.all([
          fetch("/api/users?role=student", {
            headers: {
              Authorization: `Bearer ${token || ""}`,
            },
          }),
          fetch("/api/enrollments?all=true"),
          fetch("/api/courses?includeDrafts=true"),
        ])

        const studentsData = await studentsRes.json()
        const enrollmentsData = await enrollmentsRes.json()
        const coursesData = await coursesRes.json()

        const allStudents = studentsData.users || []
        setStudents(allStudents)
        setFilteredStudents(allStudents)
        setEnrollments(enrollmentsData.enrollments || [])

        const map: Record<string, Course> = {}
        for (const course of coursesData.courses || []) {
          map[course.id] = course
        }
        setCoursesById(map)
      } catch (error) {
        console.error("Failed to load students:", error)
        setStudents([])
        setFilteredStudents([])
      }
    }

    loadData()
  }, [token])

  useEffect(() => {
    if (searchQuery) {
      const filtered = students.filter(
        (student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredStudents(filtered)
    } else {
      setFilteredStudents(students)
    }
  }, [searchQuery, students])

  const getStudentEnrollments = (userId: string) => {
    return enrollments.filter((e) => e.userId === userId)
  }

  const getCompletedCourses = (userId: string) => {
    return enrollments.filter((e) => e.userId === userId && e.progress === 100).length
  }

  const toggleStudentStatus = async (userId: string) => {
    const student = students.find((s) => s.id === userId)
    if (student) {
      const newStatus = student.status === "active" ? "suspended" : "active"
      try {
        const res = await fetch(`/api/users/${userId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || ""}`,
          },
          body: JSON.stringify({ status: newStatus }),
        })
        if (!res.ok) {
          throw new Error("Failed to update user")
        }
        setStudents(students.map((s) => (s.id === userId ? { ...s, status: newStatus } : s)))
      } catch (error) {
        console.error("Failed to update student:", error)
      }
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-balance">Student Management</h1>
        <p className="text-muted-foreground mt-2">View and manage student accounts and enrollments</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-sm text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{students.filter((s) => s.status === "active").length}</div>
            <p className="text-sm text-muted-foreground">Active Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{enrollments.length}</div>
            <p className="text-sm text-muted-foreground">Total Enrollments</p>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <div className="space-y-4">
        {filteredStudents.map((student) => {
          const enrollments = getStudentEnrollments(student.id)
          const completedCourses = getCompletedCourses(student.id)

          return (
            <Card key={student.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl font-semibold text-primary">{student.name.charAt(0)}</span>
                      </div>
                    </div>

                    {/* Student Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold">{student.name}</h3>
                        <Badge variant={student.status === "active" ? "default" : "destructive"}>
                          {student.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Mail className="h-4 w-4" />
                        <span>{student.email}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <BookOpen className="h-4 w-4" />
                            <span>Enrolled Courses</span>
                          </div>
                          <div className="font-semibold">{enrollments.length}</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Award className="h-4 w-4" />
                            <span>Completed</span>
                          </div>
                          <div className="font-semibold">{completedCourses}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Joined</div>
                          <div className="font-semibold">{formatDate(student.createdAt)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant={student.status === "active" ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleStudentStatus(student.id)}
                    >
                      {student.status === "active" ? (
                        <>
                          <Ban className="h-4 w-4 mr-2" />
                          Suspend
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${student.email}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Enrollments */}
                {enrollments.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Enrolled Courses:</p>
                    <div className="flex flex-wrap gap-2">
                      {enrollments.map((enrollment) => {
                        const course = coursesById[enrollment.courseId]
                        return course ? (
                          <Badge key={enrollment.id} variant="outline">
                            {course.title} ({enrollment.progress}%)
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredStudents.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No students found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try adjusting your search" : "No students have registered yet"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
