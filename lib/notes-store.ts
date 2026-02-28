export interface LearningNoteRecord {
  id: string
  userId: string
  content: string
  courseId?: string
  createdAt: string
  updatedAt: string
}

type NotesState = {
  notes: LearningNoteRecord[]
}

const globalState = globalThis as typeof globalThis & { __lmsNotesState?: NotesState }

function getState(): NotesState {
  if (!globalState.__lmsNotesState) {
    globalState.__lmsNotesState = { notes: [] }
  }
  return globalState.__lmsNotesState
}

export function getNotesByUserId(userId: string): LearningNoteRecord[] {
  return getState()
    .notes
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function createNote(input: { userId: string; content: string; courseId?: string }): LearningNoteRecord {
  const now = new Date().toISOString()
  const note: LearningNoteRecord = {
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    content: input.content,
    courseId: input.courseId,
    createdAt: now,
    updatedAt: now,
  }
  getState().notes.unshift(note)
  return note
}

export function deleteNote(noteId: string, userId: string): boolean {
  const state = getState()
  const index = state.notes.findIndex((n) => n.id === noteId && n.userId === userId)
  if (index === -1) return false
  state.notes.splice(index, 1)
  return true
}

