import type { NextRequest } from "next/server"
import type { User } from "@/lib/types"
import { getCurrentUserFromRequest, requireAuthentication, requireOwnership, requirePermission, requireRole } from "@/lib/authorization"

export async function getCurrentUser(request: Request | NextRequest): Promise<User | null> {
  return getCurrentUserFromRequest(request)
}

export async function requireAuth(request: Request | NextRequest): Promise<User> {
  const user = await getCurrentUser(request)
  return requireAuthentication(user) as User
}

export async function requireRoleAuth(request: Request | NextRequest, allowedRoles: "student" | "instructor" | "admin" | "finance" | Array<"student" | "instructor" | "admin" | "finance">): Promise<User> {
  const user = await requireAuth(request)
  requireRole(user, allowedRoles)
  return user
}

export async function requirePermissionAuth(request: Request | NextRequest, permission: string): Promise<User> {
  const user = await requireAuth(request)
  requirePermission(user, permission as any)
  return user
}

export async function requireOwnershipAuth(
  request: Request | NextRequest,
  ownerId: string | null | undefined,
  resourceLabel = "resource",
): Promise<User> {
  const user = await requireAuth(request)
  requireOwnership(user, ownerId, resourceLabel)
  return user
}
