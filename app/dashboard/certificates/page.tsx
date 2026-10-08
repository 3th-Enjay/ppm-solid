"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Award, BookOpen, Download, ExternalLink, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/lib/store"
import type { Certificate, Enrollment } from "@/lib/types"

type CertificateWithCourse = Certificate & {
  course?: {
    id: string
    title: string
    slug: string
    thumbnail?: string
    level?: string
  }
}

export default function CertificatesPage() {
  const { user, token } = useAuthStore()
  const [certificates, setCertificates] = useState<CertificateWithCourse[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      setLoading(true)
      try {
        const [certificatesRes, enrollmentsRes] = await Promise.all([
          fetch("/api/certificates", { headers: { Authorization: `Bearer ${token || ""}` } }),
          fetch(`/api/enrollments?userId=${user.id}`, { headers: { Authorization: `Bearer ${token || ""}` } }),
        ])

        const certificatesData = certificatesRes.ok ? await certificatesRes.json() : { certificates: [] }
        const enrollmentsData = enrollmentsRes.ok ? await enrollmentsRes.json() : { enrollments: [] }

        setCertificates(certificatesData.certificates || [])
        setEnrollments(enrollmentsData.enrollments || [])
      } catch (error) {
        console.error("Failed to load certificates page:", error)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [token, user])

  const completedWithoutCertificate = useMemo(() => {
    const certificateCourseIds = new Set(certificates.map((certificate) => certificate.courseId))
    return enrollments.filter((enrollment) => enrollment.status === "completed" && !certificateCourseIds.has(enrollment.courseId))
  }, [certificates, enrollments])

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-balance">My Certificates</h1>
        <p className="text-muted-foreground">Track issued certificates, verify your course outcomes, and see which completed courses are ready for the next credential step.</p>
      </div>

      <Card variant="elevated" className="overflow-hidden border-emerald-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_35%),linear-gradient(135deg,rgba(255,255,255,1)_0%,rgba(248,250,252,0.94)_52%,rgba(236,253,245,0.92)_100%)]">
        <CardContent className="grid gap-4 p-5 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Certificates earned</p>
            <p className="mt-2 text-3xl font-semibold">{loading ? "..." : certificates.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Completed courses awaiting certificate</p>
            <p className="mt-2 text-3xl font-semibold">{loading ? "..." : completedWithoutCertificate.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Verification ready</p>
            <p className="mt-2 text-3xl font-semibold">{loading ? "..." : certificates.length > 0 ? "Yes" : "Not yet"}</p>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card variant="elevated">
          <CardContent className="p-6 text-muted-foreground">Loading your certificates...</CardContent>
        </Card>
      ) : null}

      {certificates.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {certificates.map((certificate) => (
            <Card key={certificate.id} variant="elevated">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{certificate.course?.title || "Course certificate"}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">Issued {new Date(certificate.issuedAt).toLocaleDateString()}</p>
                  </div>
                  <Badge className="bg-emerald-600">
                    <Award className="mr-1 h-3.5 w-3.5" />
                    Earned
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Verification code: {certificate.verificationCode}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <a href={certificate.certificateUrl} target="_blank" rel="noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Open certificate
                    </a>
                  </Button>
                  {certificate.course?.slug ? (
                    <Button asChild variant="outline">
                      <Link href={`/courses/${certificate.course.slug}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View course
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !loading ? (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <Award className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No certificates yet</h3>
            <p className="mb-4 text-muted-foreground">Complete your enrolled courses to earn your first certificate and start building your verified achievement record.</p>
            <Button asChild>
              <Link href="/dashboard/courses">
                <BookOpen className="mr-2 h-4 w-4" />
                View my courses
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {completedWithoutCertificate.length > 0 ? (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-lg">Completed courses awaiting certificate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedWithoutCertificate.map((enrollment) => (
              <div key={enrollment.id} className="flex flex-col gap-2 rounded-xl border border-border/70 px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{(enrollment as Enrollment & { course?: { title?: string } }).course?.title || "Completed course"}</p>
                  <p className="text-sm text-muted-foreground">Your course is complete, but the certificate has not been issued yet.</p>
                </div>
                <Badge variant="outline">Awaiting issuance</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
