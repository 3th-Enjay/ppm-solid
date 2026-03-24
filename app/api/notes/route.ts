import { NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }
    const db = getDB() as any
    const notes = await db.getNotesByUserId(userId)
    return NextResponse.json({ notes })
  } catch (error) {
    console.error("GET /api/notes failed:", error)
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = String(body.userId || "").trim()
    const content = String(body.content || "").trim()
    const courseId = body.courseId ? String(body.courseId) : undefined

    if (!userId || !content) {
      return NextResponse.json({ error: "userId and content are required" }, { status: 400 })
    }

    const db = getDB() as any
    const note = await db.createNote({ userId, content, courseId })
    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    console.error("POST /api/notes failed:", error)
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const noteId = request.nextUrl.searchParams.get("id")
    const userId = request.nextUrl.searchParams.get("userId")
    if (!noteId || !userId) {
      return NextResponse.json({ error: "id and userId are required" }, { status: 400 })
    }

    const db = getDB() as any
    const removed = await db.deleteNote(noteId, userId)
    if (!removed) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/notes failed:", error)
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 })
  }
}

