/**
 * Course masking utilities for protecting sensitive video URLs
 * from unauthorized users while allowing admins and course instructors
 * full access to content.
 */

const YOUTUBE_REGEX = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/

/**
 * Mask sensitive course data (videoUrl) for non-privileged users
 * - Admins and course instructors see full videoUrl
 * - Others see extracted videoId (for YouTube embeds) or nothing
 * 
 * @param course - The course object to mask
 * @param user - The current user (null if unauthenticated)
 * @returns Masked course object
 */
export function maskCourseForUser(course: any, user: any): any {
  const isAdmin = user?.role === "admin"
  const isInstructorOwner = user?.role === "instructor" && course.instructorId === user.id

  // If admin or the course instructor, return as-is
  if (isAdmin || isInstructorOwner) return course

  // Otherwise, avoid returning raw videoUrl - extract youtube id if possible
  const copy = JSON.parse(JSON.stringify(course))
  
  for (const mod of copy.modules || []) {
    for (const lesson of mod.lessons || []) {
      if (lesson.content?.videoUrl) {
        const url = lesson.content.videoUrl as string
        const ytMatch = url.match(YOUTUBE_REGEX)
        
        if (ytMatch && ytMatch[1]) {
          // Keep videoId for frontend to embed, but remove raw URL
          lesson.content.videoId = ytMatch[1]
        }
        
        // Always remove the raw URL to prevent leakage
        delete lesson.content.videoUrl
      }
    }
  }
  
  return copy
}

/**
 * Extract YouTube video ID from a URL
 * Returns the 11-character video ID or null if not a YouTube URL
 */
export function extractYoutubeVideoId(url: string): string | null {
  const match = url.match(YOUTUBE_REGEX)
  return match?.[1] ?? null
}
