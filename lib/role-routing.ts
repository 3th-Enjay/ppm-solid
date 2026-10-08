import type { UserRole } from "@/lib/types"

const ROLE_HOME: Record<UserRole, string> = {
  student: "/dashboard",
  instructor: "/instructor",
  admin: "/admin",
  finance: "/finance",
}

export function getRoleHomePath(role?: string): string {
  if (!role) return "/login"
  return ROLE_HOME[role as UserRole] || "/dashboard"
}

export function getSafeRedirectForRole(role: string, requestedRedirect?: string | null): string {
  const roleHome = getRoleHomePath(role)

  if (!requestedRedirect || !requestedRedirect.startsWith("/")) {
    return roleHome
  }

  // Keep each role inside its own dashboard namespace.
  if (requestedRedirect === roleHome || requestedRedirect.startsWith(`${roleHome}/`)) {
    return requestedRedirect
  }

  return roleHome
}

export function getCourseDetailPathForRole(role: string | undefined, course: { id: string; slug?: string }): string {
  if (role === "admin") {
    return `/admin/courses/${course.id}/edit`
  }
  if (course.slug) {
    return `/courses/${course.slug}`
  }
  return "/courses"
}
