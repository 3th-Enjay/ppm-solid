import type { NextRequest } from "next/server"
import type { User } from "@/lib/types"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"

export type Role = "student" | "instructor" | "admin" | "finance"
export type Permission =
  | "course:create"
  | "course:update"
  | "course:publish"
  | "course:approve"
  | "course:delete"
  | "student:read"
  | "student:update"
  | "instructor:read"
  | "instructor:update"
  | "payment:read"
  | "payment:verify"
  | "admin:read"
  | "admin:manage"
  | "certificate:create"

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  student: ["student:read", "student:update", "certificate:create"],
  instructor: ["course:create", "course:update", "course:publish", "instructor:read", "instructor:update", "student:read"],
  admin: ["course:create", "course:update", "course:publish", "course:approve", "course:delete", "student:read", "student:update", "instructor:read", "instructor:update", "payment:read", "payment:verify", "admin:read", "admin:manage", "certificate:create"],
  finance: ["payment:read", "payment:verify", "admin:read"],
}

export async function getCurrentUserFromRequest(request: Request | NextRequest): Promise<User | null> {
  const token = getTokenFromRequest(request)
  if (!token) {
    return null
  }

  return authService.getCurrentUser(token)
}

export function hasRole(user: Pick<User, "role"> | null | undefined, allowedRoles: Role | Role[]): boolean {
  if (!user?.role) {
    return false
  }

  const acceptedRoles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  return acceptedRoles.includes(user.role as Role)
}

export function hasPermission(user: Pick<User, "role"> | null | undefined, requiredPermission: Permission): boolean {
  if (!user?.role) {
    return false
  }

  return ROLE_PERMISSIONS[user.role as Role]?.includes(requiredPermission) ?? false
}

export function canAccessOwnedResource(user: Pick<User, "id" | "role"> | null | undefined, ownerId?: string | null): boolean {
  if (!user) {
    return false
  }

  if (user.role === "admin") {
    return true
  }

  return !!ownerId && user.id === ownerId
}

export function requireAuthentication(user: Pick<User, "id" | "role"> | null | undefined): Pick<User, "id" | "role"> {
  if (!user?.id || !user?.role) {
    throw new Error("Authentication required")
  }

  return user
}

export function resolveAuthorizedUserId(
  actingUser: Pick<User, "id" | "role"> | null | undefined,
  requestedUserId: string,
): string {
  const authenticatedUser = requireAuthentication(actingUser)

  if (authenticatedUser.role !== "admin" && authenticatedUser.id !== requestedUserId) {
    throw new Error("Forbidden")
  }

  return authenticatedUser.role === "admin" ? requestedUserId : authenticatedUser.id
}

export function requireRole(user: Pick<User, "id" | "role"> | null | undefined, allowedRoles: Role | Role[]): Pick<User, "id" | "role"> {
  const authenticatedUser = requireAuthentication(user)

  if (!hasRole(authenticatedUser as Pick<User, "role">, allowedRoles)) {
    throw new Error("Forbidden")
  }

  return authenticatedUser
}

export function requirePermission(user: Pick<User, "id" | "role"> | null | undefined, requiredPermission: Permission): Pick<User, "id" | "role"> {
  const authenticatedUser = requireAuthentication(user)

  if (!hasPermission(authenticatedUser as Pick<User, "role">, requiredPermission)) {
    throw new Error("Forbidden")
  }

  return authenticatedUser
}

export function requireOwnership(
  user: Pick<User, "id" | "role"> | null | undefined,
  ownerId: string | null | undefined,
  resourceLabel = "resource",
): Pick<User, "id" | "role"> {
  const authenticatedUser = requireAuthentication(user)

  if (!canAccessOwnedResource(authenticatedUser, ownerId)) {
    throw new Error(`You do not own this ${resourceLabel}`)
  }

  return authenticatedUser
}

export function sanitizeCourseMutationInput(
  input: Record<string, any> | null | undefined,
  actingUser: Pick<User, "id" | "role">,
  options: { allowPublishedUpdate?: boolean } = {},
): Record<string, any> {
  const payload = { ...(input ?? {}) }

  if (actingUser.role !== "admin") {
    delete payload.instructorId
    delete payload.ownerId
    delete payload.createdBy
    delete payload.publishedBy
    delete payload.approved
    delete payload.approvalStatus
    delete payload.isApproved
    payload.approved = false
    payload.published = false
  } else {
    delete payload.ownerId
    delete payload.createdBy
    delete payload.publishedBy
    delete payload.approvalStatus
    delete payload.isApproved

    if (typeof payload.approved !== "boolean") {
      payload.approved = false
    }

    if (!options.allowPublishedUpdate && typeof payload.published === "boolean") {
      payload.published = false
    }
  }

  if (actingUser.role === "instructor") {
    payload.instructorId = actingUser.id
  }

  return payload
}
