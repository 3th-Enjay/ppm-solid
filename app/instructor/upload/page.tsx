"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, Upload, Link as LinkIcon } from "lucide-react"

export default function InstructorUploadPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/instructor">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add Course Videos</h1>
        <p className="text-muted-foreground mt-2">
          This platform uses YouTube links for video lessons. Upload to YouTube, then paste the link in your course content.
        </p>
      </div>

      <Alert className="mb-6">
        <AlertTitle>How it works</AlertTitle>
        <AlertDescription>
          YouTube hosts the videos. Instructors add the YouTube link to each video lesson so students can stream it inside the course.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Video Upload Steps</CardTitle>
          <CardDescription>Follow these steps before adding lesson videos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal pl-5 text-sm space-y-2">
            <li>Upload your video to YouTube.</li>
            <li>Set visibility to Public or Unlisted (not Private).</li>
            <li>Copy the share link from YouTube.</li>
            <li>Open your course content editor and paste the link in the Video URL field.</li>
          </ol>
          <div className="rounded-lg border p-4 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <LinkIcon className="h-4 w-4" />
              Example links
            </div>
            <p className="text-muted-foreground mt-2">
              https://youtu.be/VIDEOID or https://www.youtube.com/watch?v=VIDEOID
            </p>
          </div>
          <Button asChild>
            <Link href="/instructor/courses">
              <Upload className="h-4 w-4 mr-2" />
              Go to My Courses
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
