import "server-only"

const RESEND_API_URL = "https://api.resend.com/emails"

function getResendKey() {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    // In development, log warning but don't throw to allow testing
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

export async function sendOtpEmail(params: { to: string; name: string; otp: string }) {
  const key = getResendKey()
  
  // In development without API key, log the OTP instead
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
        <p>— Promptcare Academy</p>
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
  const payload = {
    from: getFromEmail(),
    to: [params.to],
    subject: "Welcome to Promptcare Academy",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Welcome to Promptcare Academy</h2>
        <p>Hi ${params.name},</p>
        <p>Welcome to Promptcare Academy! Your account has been successfully verified and activated.</p>
        <p>You can now explore courses, enroll, and start learning. If you selected a preferred currency during signup, prices will display accordingly. You can change the currency anytime during checkout.</p>
        <p>If you have any questions, reply to this email and we'll help.</p>
        <p>— Promptcare Academy</p>
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
        <p>— Promptcare Academy</p>
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
        <p>Good news — your lesson <strong>${params.lessonTitle}</strong> in <strong>${params.courseTitle}</strong> has been <strong>approved</strong> and is now available to students.</p>
        <p>— Promptcare Academy</p>
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
  
  // In development without API key, log the reset info instead
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
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">— Promptcare Academy</p>
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
