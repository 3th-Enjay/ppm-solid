import { type NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/db"
import type { User } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get("role")
    const id = searchParams.get("id")

    const db = getDB()

    if (id) {
      const user = await db.findUserById(id)
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
      const { password: _, ...safeUser } = user
      return NextResponse.json({ user: safeUser })
    }

    let users: User[] = await db.getAllUsers()
    if (role) {
      users = users.filter((u) => u.role === role)
    }

    const safeUsers = users.map(({ password: _, ...rest }) => rest)
    return NextResponse.json({ users: safeUsers })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Failed to get users" }, { status: 500 })
  }
}
