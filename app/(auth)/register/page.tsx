import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function RegisterHubPage() {
  return (
    <div className="w-full max-w-4xl py-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold">Choose Registration Type</h1>
        <p className="mt-2 text-muted-foreground">Select the registration flow that matches your learning mode.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Onsite Student Registration</CardTitle>
            <CardDescription>Includes onsite payment confirmation. Onsite students get free course access.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/register-onsite">Continue Onsite Registration</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Online Student Registration</CardTitle>
            <CardDescription>No onsite fee. Online students buy courses to access paid content.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/register-online">Continue Online Registration</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Want to teach?{" "}
        <Link href="/register-instructor" className="font-medium text-primary hover:underline">
          Register as an instructor
        </Link>
      </p>
    </div>
  )
}
