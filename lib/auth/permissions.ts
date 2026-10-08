import type { Permission, Role } from "@/lib/authorization"

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  student: ["student:read", "student:update", "certificate:create"],
  instructor: ["course:create", "course:update", "course:publish", "instructor:read", "instructor:update", "student:read"],
  admin: ["course:create", "course:update", "course:publish", "course:approve", "course:delete", "student:read", "student:update", "instructor:read", "instructor:update", "payment:read", "payment:verify", "admin:read", "admin:manage", "certificate:create"],
  finance: ["payment:read", "payment:verify", "admin:read"],
}

export function hasRequiredPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}
