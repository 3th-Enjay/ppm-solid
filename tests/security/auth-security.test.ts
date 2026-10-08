import test from "node:test"
import assert from "node:assert/strict"

import { hasPermission, requireRole, resolveAuthorizedUserId, sanitizeCourseMutationInput } from "@/lib/authorization"

test("instructor cannot override ownership or approve a course from request data", () => {
  const sanitized = sanitizeCourseMutationInput(
    {
      title: "Test Course",
      instructorId: "other-instructor",
      approved: true,
      published: true,
      ownerId: "other-instructor",
    },
    { id: "current-instructor", role: "instructor" },
  )

  assert.equal(sanitized.instructorId, "current-instructor")
  assert.equal(sanitized.approved, false)
  assert.equal(sanitized.published, false)
  assert.equal(sanitized.ownerId, undefined)
})

test("admin can approve a course but cannot accept arbitrary ownership fields", () => {
  const sanitized = sanitizeCourseMutationInput(
    {
      title: "Test Course",
      instructorId: "other-instructor",
      approved: true,
      published: true,
      ownerId: "hacker",
    },
    { id: "admin-1", role: "admin" },
  )

  assert.equal(sanitized.instructorId, "other-instructor")
  assert.equal(sanitized.approved, true)
  assert.equal(sanitized.ownerId, undefined)
  assert.equal(sanitized.published, false)
})

test("student cannot create or modify privileged course fields", () => {
  const sanitized = sanitizeCourseMutationInput(
    {
      title: "Test Course",
      instructorId: "other-instructor",
      approved: true,
      published: true,
    },
    { id: "student-1", role: "student" },
  )

  assert.equal(sanitized.instructorId, undefined)
  assert.equal(sanitized.approved, false)
  assert.equal(sanitized.published, false)
})

test("role utilities enforce the expected permission set", () => {
  assert.equal(hasPermission({ role: "instructor" }, "course:create"), true)
  assert.equal(hasPermission({ role: "student" }, "course:create"), false)
  assert.equal(hasPermission({ role: "finance" }, "payment:verify"), true)
})

test("requireRole rejects unauthorized users", () => {
  assert.throws(() => requireRole({ id: "student-1", role: "student" }, "admin"), /Forbidden/)
  assert.doesNotThrow(() => requireRole({ id: "admin-1", role: "admin" }, "admin"))
})

test("user ID authorization allows self-service and admin access but rejects cross-user access", () => {
  assert.equal(resolveAuthorizedUserId({ id: "student-1", role: "student" }, "student-1"), "student-1")
  assert.equal(resolveAuthorizedUserId({ id: "admin-1", role: "admin" }, "student-1"), "student-1")
  assert.throws(
    () => resolveAuthorizedUserId({ id: "student-1", role: "student" }, "student-2"),
    /Forbidden/,
  )
  assert.throws(() => resolveAuthorizedUserId(null, "student-1"), /Authentication required/)
})
