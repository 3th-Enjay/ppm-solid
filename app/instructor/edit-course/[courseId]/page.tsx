import { redirect } from "next/navigation"

export default async function InstructorEditCourseAliasPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  redirect(`/instructor/courses/${courseId}/edit`)
}

