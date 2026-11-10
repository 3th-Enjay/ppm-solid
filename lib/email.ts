import { getAcademyName } from "@/lib/brand-config"

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
  return process.env.RESEND_FROM || `${getAcademyName()} <no-reply@technologyacademy.org>`
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
  const academyName = getAcademyName()

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
      subject: `Welcome to ${academyName}`,
      heading: `Welcome to ${academyName}`,
      intro: "Your account is verified and ready. You can now explore software engineering tracks, enroll in industry-aligned courses, and begin your technical learning journey.",
      primaryActionLabel: "Open Student Dashboard",
      primaryActionUrl: `${appUrl}/dashboard`,
      importantDetails: [
        "Browse technical curricula spanning full-stack development, cloud engineering, AI/ML, and cybersecurity.",
        "Complete code exercises, quizzes, assignments, and capstone projects to build your verified portfolio.",
        "Keep your profile and repository links updated so faculty and mentors can review your work.",
      ],
      closing: "If you need assistance with admissions, enrollment, or platform access, reply directly to this email.",
    },
    instructor: {
      subject: `Welcome to the ${academyName} Faculty Portal`,
      heading: "Your Faculty Workspace is Ready",
      intro: "Your instructor account is active. This is your engineering workspace for architecting technical courses, managing code-driven modules, and preparing curriculum for academic review.",
      primaryActionLabel: "Open Faculty Workspace",
      primaryActionUrl: `${appUrl}/instructor`,
      importantDetails: [
        "Complete your engineering bio, GitHub profile, and technical specialties so learners understand your industry background.",
        "Author module curricula, technical markdown guides, assignments, and capstone projects.",
        "Submit new courses and lessons for academic review prior to student publication.",
        "Track learner submissions, code evaluations, and course performance directly from your workspace.",
      ],
      closing: "If you need guidance on syllabus structure or technical evaluation tools, reply to this email.",
    },
    admin: {
      subject: `Welcome to the ${academyName} Operations Workspace`,
      heading: "Academic Operations Command Center",
      intro: "Your administrator account is active. You have full access to manage platform operations, curriculum approval queues, category architecture, and financial transactions.",
      primaryActionLabel: "Open Admin Workspace",
      primaryActionUrl: `${appUrl}/admin`,
      importantDetails: [
        "Review courses awaiting approval, instructor verifications, and platform activity logs from your dashboard.",
        "Manage technology taxonomy, student accounts, and payment verifications with care.",
        "If your account was provisioned with a temporary password, please update your credentials immediately.",
        "Coordinate with finance and faculty teams when scheduling releases or changes.",
      ],
      closing: "For administrative support or systems assistance, reach out directly to the operations team.",
    },
    finance: {
      subject: `Welcome to the ${academyName} Finance Operations`,
      heading: "Finance & Reconciliation Workspace",
      intro: "Your finance account is active. You can now audit currency-specific transactions, review Paystack verifications, and oversee platform financial health.",
      primaryActionLabel: "Open Finance Dashboard",
      primaryActionUrl: `${appUrl}/finance`,
      importantDetails: [
        "Monitor verified payments across NGN, USD, EUR, and GBP with real-time transaction records.",
        "Confirm payment reference, gateway transaction status, and student credentials prior to manual verifications.",
        "Work in tandem with academic administrators regarding enrollment-linked payment states.",
        "Change your temporary password upon initial platform sign-in.",
      ],
      closing: "If you need financial reconciliation guidance, reply to this email for support.",
    },
  }

  const selected = content[role]
  const detailsHtml = selected.importantDetails
    .map((item) => `<li style="margin-bottom: 8px;">${item}</li>`)
    .join("")

  return {
    subject: selected.subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 640px; margin: 0 auto; color: #1e293b;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e40af 100%); padding: 32px 28px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">${selected.heading}</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #93c5fd;">${academyName}</p>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #ffffff; padding: 32px 28px;">
          <p style="margin-top: 0; font-size: 16px;">Hi ${params.name},</p>
          <p style="font-size: 16px; color: #334155;">${selected.intro}</p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${selected.primaryActionUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 26px; border-radius: 8px; font-weight: 600; font-size: 15px;">
              ${selected.primaryActionLabel}
            </a>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h2 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #0f172a;">Important Information</h2>
            <ul style="padding-left: 20px; margin: 0; color: #475569; font-size: 14px;">
              ${detailsHtml}
            </ul>
          </div>
          <p style="font-size: 14px; color: #475569;">${selected.closing}</p>
          <p style="font-size: 13px; color: #64748b; margin-bottom: 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">— ${academyName}</p>
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
    subject: `Your ${getAcademyName()} verification code`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 580px; margin: 0 auto; color: #1e293b;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e40af 100%); padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="margin: 0; color: #ffffff; font-size: 20px;">Email Verification</h2>
          <p style="margin: 4px 0 0 0; color: #93c5fd; font-size: 13px;">${getAcademyName()}</p>
        </div>
        <div style="background: #ffffff; padding: 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="margin-top: 0;">Hi ${params.name},</p>
          <p style="color: #475569;">Please use the following single-use verification code to authenticate your account:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #1e40af; background: #eff6ff; padding: 12px 24px; border-radius: 8px; border: 1px solid #bfdbfe; display: inline-block;">${params.otp}</span>
          </div>
          <p style="font-size: 13px; color: #64748b;">This code expires in ${process.env.OTP_EXPIRES_MINUTES || 15} minutes. If you did not request this verification, you can safely disregard this message.</p>
          <p style="font-size: 13px; color: #94a3b8; margin-bottom: 0; border-top: 1px solid #f1f5f9; padding-top: 14px;">— ${getAcademyName()}</p>
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
    subject: `Curriculum Review: Changes Requested for "${params.courseTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 580px; margin: 0 auto; color: #1e293b;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #dc2626 100%); padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="margin: 0; color: #ffffff; font-size: 20px;">Curriculum Review Update</h2>
          <p style="margin: 4px 0 0 0; color: #fecaca; font-size: 13px;">${getAcademyName()} Academic Operations</p>
        </div>
        <div style="background: #ffffff; padding: 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="margin-top: 0;">Hi ${params.name},</p>
          <p style="color: #475569;">The academic review committee has reviewed your lesson <strong>"${params.lessonTitle}"</strong> in course <strong>"${params.courseTitle}"</strong> and requested revisions before publication.</p>
          <div style="background: #fef2f2; border: 1px solid #fee2e2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #991b1b;">Reviewer Notes & Feedback:</p>
            <p style="margin: 0; font-size: 14px; color: #7f1d1d;">${params.note || "No specific feedback provided. Please review lesson objectives, code snippets, and curriculum completeness."}</p>
          </div>
          <p style="font-size: 13px; color: #64748b;">Please revise the technical content and resubmit for approval in your instructor workspace.</p>
          <p style="font-size: 13px; color: #94a3b8; margin-bottom: 0; border-top: 1px solid #f1f5f9; padding-top: 14px;">— ${getAcademyName()} Academic Operations</p>
        </div>
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
    subject: `Lesson Approved: "${params.lessonTitle}" in ${params.courseTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 580px; margin: 0 auto; color: #1e293b;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #16a34a 100%); padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="margin: 0; color: #ffffff; font-size: 20px;">Lesson Approved</h2>
          <p style="margin: 4px 0 0 0; color: #bbf7d0; font-size: 13px;">${getAcademyName()} Academic Operations</p>
        </div>
        <div style="background: #ffffff; padding: 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="margin-top: 0;">Hi ${params.name},</p>
          <p style="color: #475569;">Great news! Your lesson <strong>"${params.lessonTitle}"</strong> in <strong>"${params.courseTitle}"</strong> has been approved by the academic committee and is now published to learners.</p>
          <p style="font-size: 13px; color: #64748b;">You can track student engagement, quiz submissions, and feedback directly from your instructor workspace.</p>
          <p style="font-size: 13px; color: #94a3b8; margin-bottom: 0; border-top: 1px solid #f1f5f9; padding-top: 14px;">— ${getAcademyName()} Academic Operations</p>
        </div>
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
    subject: `Reset your ${getAcademyName()} password`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e40af 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Password Reset Request</h1>
          <p style="color: #93c5fd; margin: 6px 0 0 0; font-size: 13px;">${getAcademyName()}</p>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #334155; margin-bottom: 20px;">Hi ${params.name},</p>
          <p style="font-size: 15px; color: #334155; margin-bottom: 20px;">We received a request to reset your password for your ${getAcademyName()} account.</p>
          <p style="font-size: 15px; color: #334155; margin-bottom: 30px;">Click the button below to choose a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${params.resetUrl}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 15px;">Reset Password</a>
          </div>
          <div style="background: #f8fafc; padding: 18px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 24px 0;">
            <p style="font-size: 13px; color: #64748b; margin: 0 0 8px 0;"><strong>Or copy and paste this link into your browser:</strong></p>
            <p style="font-size: 12px; color: #1e293b; word-break: break-all; margin: 0; font-family: monospace;">${params.resetUrl}</p>
          </div>
          <div style="background: #eff6ff; padding: 16px; border-radius: 6px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <p style="font-size: 13px; color: #1e40af; margin: 0 0 6px 0;"><strong>Your verification code:</strong></p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1e3a8a; margin: 0; font-family: monospace;">${params.token}</p>
          </div>
          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">This link will expire in <strong>1 hour</strong>. If you did not request this password reset, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">— ${getAcademyName()}</p>
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