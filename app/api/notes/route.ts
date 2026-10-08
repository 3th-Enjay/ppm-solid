import { NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/db"
import { getTokenFromRequest } from "@/lib/jwt"
import { authService } from "@/lib/auth"

async function getAuthenticatedUser(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) return null
  return authService.getCurrentUser(token)
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = request.nextUrl.searchParams.get("userId")
    if (userId && userId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const db = getDB() as any
    const notes = await db.getNotesByUserId(currentUser.id)
    return NextResponse.json({ notes })
  } catch (error) {
    console.error("GET /api/notes failed:", error)
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const content = String(body.content || "").trim()
    const courseId = body.courseId ? String(body.courseId) : undefined

    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 })
    }

    const db = getDB() as any
    const note = await db.createNote({ userId: currentUser.id, content, courseId })
    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    console.error("POST /api/notes failed:", error)
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const noteId = request.nextUrl.searchParams.get("id")
    if (!noteId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const db = getDB() as any
    const removed = await db.deleteNote(noteId, currentUser.id)
    if (!removed) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/notes failed:", error)
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 })
  }
}
