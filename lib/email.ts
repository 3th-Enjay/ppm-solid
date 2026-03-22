import "server-only"

const RESEND_API_URL = "https://api.resend.com/emails"

type WelcomeEmailRole = "student" | "instructor" | "admin" | "finance"

function getResendKey() {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    if (process.env.NODE_ENV === "development") {
      console.warn("RESEND_API_KEY is not set. Emails will not be sent.")
      return "dev-key"
    }
    throw new Error("RESEND_API_KEY is not set")
  }
  return key
}

function getFromEmail() {
  return process.env.RESEND_FROM || "Promptcare Academy <no-reply@promptcareacademy.com>"
}

function getAppBaseUrl() {
  const publicUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (publicUrl) {
    return publicUrl
  }

  const vercelUrl = process.env.VERCEL_URL?.trim()
  if (vercelUrl) {
    return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`
  }

  return "http://localhost:3000"
}

function getWelcomeEmailContent(params: { name: string; role?: string }) {
  const role: WelcomeEmailRole =
    params.role === "instructor" ||
    params.role === "admin" ||
    params.role === "finance" ||
    params.role === "student"
      ? params.role
      : "student"

  const appUrl = getAppBaseUrl()

  const content: Record<
    WelcomeEmailRole,
    {
      subject: string
      heading: string
      intro: string
      primaryActionLabel: string
      primaryActionUrl: string
      importantDetails: string[]
      closing: string
    }
  > = {
    student: {
      subject: "Welcome to Promptcare Academy",
      heading: "Welcome to Promptcare Academy",
      intro: "Your account is verified and ready to use. You can now sign in, explore courses, and continue your learning journey.",
      primaryActionLabel: "Open Student Dashboard",
      primaryActionUrl: `${appUrl}/dashboard`,
      importantDetails: [
        "Browse available courses and complete checkout when you are ready to enroll.",
        "If you selected onsite training, your full access depends on successful payment verification.",
        "Keep your email and profile details current so you do not miss updates about your learning account.",
      ],
      closing: "If you need help with enrollment, payment, or access, reply to this email and our team will assist you.",
    },
    instructor: {
      subject: "Welcome to the Promptcare instructor portal",
      heading: "Your instructor workspace is ready",
      intro: "Your instructor account is active. This is your teaching workspace for building courses, uploading lessons, and preparing content for review and publishing.",
      primaryActionLabel: "Open Instructor Workspace",
      primaryActionUrl: `${appUrl}/instructor`,
      importantDetails: [
        "Start by completing your bio, professional headline, and specialties so students can clearly understand your teaching profile.",
        "Create your course structure, upload lessons, and review your materials carefully before submitting them for approval.",
        "Course and lesson changes may require admin review before they become visible to students on the platform.",
        "Monitor your dashboard for approval feedback, learner activity, and updates related to your published content.",
      ],
      closing: "If you want help setting up your first course or preparing content for approval, reply to this email and we will guide you.",
    },
    admin: {
      subject: "Welcome to the Promptcare admin dashboard",
      heading: "Welcome to the admin team",
      intro: "Your admin account is ready. You now have access to the tools used to manage platform operations, users, courses, and payment oversight.",
      primaryActionLabel: "Open Admin Dashboard",
      primaryActionUrl: `${appUrl}/admin`,
      importantDetails: [
        "Review users, courses, payments, and activity logs from the admin dashboard before making live changes.",
        "Use suspend, delete, approval, and payment verification actions carefully because they affect real accounts and platform access.",
        "If this account was provisioned for you by the team, sign in with the credentials you were given and change your password immediately.",
        "Coordinate with finance and instructors when a change affects payments, publishing, or learner access.",
      ],
      closing: "If anything about your access looks wrong, reply to this email before making changes in production.",
    },
    finance: {
      subject: "Welcome to the Promptcare finance dashboard",
      heading: "Welcome to the finance team",
      intro: "Your finance account is active. You can now review transactions, investigate payment issues, and support reconciliation work from the finance dashboard.",
      primaryActionLabel: "Open Finance Dashboard",
      primaryActionUrl: `${appUrl}/finance`,
      importantDetails: [
        "Use the finance dashboard to track transactions, review payment status, and investigate mismatches or pending cases.",
        "Before approving or escalating any payment, confirm the reference, amount, currency, and customer email match the payment record.",
        "Work closely with admin when a payment decision could change course access, onsite registration, or account activation.",
        "If this account was provisioned for you by the team, change the temporary password after your first sign-in.",
      ],
      closing: "If you need support with reconciliation or transaction review, reply to this email and we will help.",
    },
  }

  const selected = content[role]
  const detailsHtml = selected.importantDetails
    .map((item) => `<li style="margin-bottom: 8px;">${item}</li>`)
    .join("")

  return {
    subject: selected.subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 640px; margin: 0 auto; color: #1f2937;">
        <div style="background: linear-gradient(135deg, #0f766e 0%, #10b981 100%); padding: 28px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: #ffffff;">${selected.heading}</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; background: #ffffff; padding: 28px;">
          <p style="margin-top: 0; font-size: 16px;">Hi ${params.name},</p>
          <p style="font-size: 16px;">${selected.intro}</p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${selected.primaryActionUrl}" style="display: inline-block; background: #0f766e; color: #ffffff; text-decoration: none; padding: 14px 22px; border-radius: 8px; font-weight: 600;">
              ${selected.primaryActionLabel}
            </a>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #111827;">Important details</h2>
            <ul style="padding-left: 20px; margin: 0; color: #374151;">
              ${detailsHtml}
            </ul>
          </div>
          <p style="font-size: 15px;">${selected.closing}</p>
          <p style="font-size: 13px; color: #6b7280; margin-bottom: 0;">- Promptcare Academy</p>
        </div>
      </div>
    `,
  }
}

export async function sendOtpEmail(params: { to: string; name: string; otp: string }) {
  const key = getResendKey()

  if (key === "dev-key") {
    console.log("=".repeat(50))
    console.log("OTP EMAIL (Development Mode - RESEND_API_KEY not set)")
    console.log("To:", params.to)
    console.log("Name:", params.name)
    console.log("OTP Code:", params.otp)
    console.log("=".repeat(50))
    return
  }

  const payload = {
    from: getFromEmail(),
    to: [params.to],
    subject: "Your Promptcare Academy verification code",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Verify your email</h2>
        <p>Hi ${params.name},</p>
        <p>Your one-time password (OTP) is:</p>
        <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${params.otp}</div>
        <p>This code expires in ${process.env.OTP_EXPIRES_MINUTES || 15} minutes. If you did not request this, you can ignore this email.</p>
        <p>- Promptcare Academy</p>
      </div>
    `,
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error("Resend API error:", text)
      throw new Error(`Failed to send email: ${text}`)
    }
  } catch (error) {
    console.error("Error sending OTP email:", error)
    throw error
  }
}

export async function sendWelcomeEmail(params: { to: string; name: string; role?: string }) {
  const key = getResendKey()
  const payload = {
    from: getFromEmail(),
    to: [params.to],
    ...getWelcomeEmailContent({ name: params.name, role: params.role }),
  }

  if (key === "dev-key") {
    console.log("=".repeat(50))
    console.log("WELCOME EMAIL (Development Mode - RESEND_API_KEY not set)")
    console.log("To:", params.to)
    console.log("Name:", params.name)
    console.log("Role:", params.role || "student")
    console.log("Subject:", payload.subject)
    console.log("=".repeat(50))
    return
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend error: ${text}`)
  }
}

export async function sendLessonRejectedEmail(params: { to: string; name: string; courseTitle: string; lessonTitle: string; note?: string }) {
  const payload = {
    from: getFromEmail(),
    to: [params.to],
    subject: `Lesson rejected for ${params.courseTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Lesson review result</h2>
        <p>Hi ${params.name},</p>
        <p>Your lesson <strong>${params.lessonTitle}</strong> in <strong>${params.courseTitle}</strong> was reviewed and <strong>rejected</strong> by the admin team.</p>
        <p><strong>Reason:</strong> ${params.note || "No reason provided."}</p>
        <p>Please update the lesson and resubmit it for review.</p>
        <p>- Promptcare Academy</p>
      </div>
    `,
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getResendKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend error: ${text}`)
  }
}

export async function sendLessonApprovedEmail(params: { to: string; name: string; courseTitle: string; lessonTitle: string }) {
  const payload = {
    from: getFromEmail(),
    to: [params.to],
    subject: `Lesson approved for ${params.courseTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Lesson approved</h2>
        <p>Hi ${params.name},</p>
        <p>Good news - your lesson <strong>${params.lessonTitle}</strong> in <strong>${params.courseTitle}</strong> has been <strong>approved</strong> and is now available to students.</p>
        <p>- Promptcare Academy</p>
      </div>
    `,
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getResendKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend error: ${text}`)
  }
}

export async function sendPasswordResetEmail(params: { to: string; name: string; resetUrl: string; token: string }) {
  const key = getResendKey()

  if (key === "dev-key") {
    console.log("=".repeat(50))
    console.log("PASSWORD RESET EMAIL (Development Mode - RESEND_API_KEY not set)")
    console.log("To:", params.to)
    console.log("Name:", params.name)
    console.log("Reset URL:", params.resetUrl)
    console.log("Reset Code:", params.token)
    console.log("=".repeat(50))
    return
  }

  const payload = {
    from: getFromEmail(),
    to: [params.to],
    subject: "Reset your Promptcare Academy password",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #16A34A 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset Request</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hi ${params.name},</p>
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">We received a request to reset your password for your Promptcare Academy account.</p>
          <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${params.resetUrl}" style="background-color: #10B981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">Reset Password</a>
          </div>
          <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 30px 0;">
            <p style="font-size: 14px; color: #6b7280; margin: 0 0 10px 0;"><strong>Or copy and paste this link into your browser:</strong></p>
            <p style="font-size: 12px; color: #374151; word-break: break-all; margin: 0; font-family: monospace;">${params.resetUrl}</p>
          </div>
          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="font-size: 14px; color: #92400e; margin: 0 0 8px 0;"><strong>Your reset code:</strong></p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #92400e; margin: 0; font-family: monospace;">${params.token}</p>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">This link will expire in <strong>1 hour</strong>. If you did not request this password reset, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">- Promptcare Academy</p>
        </div>
      </div>
    `,
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error("Resend API error:", text)
      throw new Error(`Failed to send email: ${text}`)
    }
  } catch (error) {
    console.error("Error sending password reset email:", error)
    throw error
  }
}

export async function sendPaymentManualReviewAlert(params: {
  to: string
  reference: string
  paymentType?: string
  amount: number
  currency: string
  userEmail?: string
  source: string
  reason: string
}) {
  const key = getResendKey()

  if (key === "dev-key") {
    console.log("=".repeat(50))
    console.log("MANUAL REVIEW ALERT (Development Mode - RESEND_API_KEY not set)")
    console.log("To:", params.to)
    console.log("Reference:", params.reference)
    console.log("Reason:", params.reason)
    console.log("Source:", params.source)
    console.log("=".repeat(50))
    return
  }

  const payload = {
    from: getFromEmail(),
    to: [params.to],
    subject: `[Payment Alert] Manual Review Required - ${params.reference}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Manual Payment Review Required</h2>
        <p>A payment has been flagged for manual review.</p>
        <ul>
          <li><strong>Reference:</strong> ${params.reference}</li>
          <li><strong>Type:</strong> ${params.paymentType || "N/A"}</li>
          <li><strong>Amount:</strong> ${params.amount} ${params.currency}</li>
          <li><strong>User Email:</strong> ${params.userEmail || "N/A"}</li>
          <li><strong>Source:</strong> ${params.source}</li>
          <li><strong>Reason:</strong> ${params.reason}</li>
        </ul>
        <p>Use the admin payment verification page to review and take action.</p>
      </div>
    `,
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend error: ${text}`)
  }
}