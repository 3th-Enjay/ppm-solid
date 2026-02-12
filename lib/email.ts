import "server-only"

const RESEND_API_URL = "https://api.resend.com/emails"

function getResendKey() {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error("RESEND_API_KEY is not set")
  }
  return key
}

function getFromEmail() {
  return process.env.RESEND_FROM || "PromptCare Academy <no-reply@promptcareacademy.com>"
}

export async function sendOtpEmail(params: { to: string; name: string; otp: string }) {
  const payload = {
    from: getFromEmail(),
    to: [params.to],
    subject: "Your PromptCare Academy verification code",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Verify your email</h2>
        <p>Hi ${params.name},</p>
        <p>Your one-time password (OTP) is:</p>
        <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${params.otp}</div>
        <p>This code expires soon. If you did not request this, you can ignore this email.</p>
        <p>— PromptCare Academy</p>
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

export async function sendWelcomeEmail(params: { to: string; name: string; role?: string }) {
  const payload = {
    from: getFromEmail(),
    to: [params.to],
    subject: "Welcome to PromptCare Academy",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Welcome to PromptCare Academy</h2>
        <p>Hi ${params.name},</p>
        <p>Welcome to PromptCare Academy! Your account has been successfully verified and activated.</p>
        <p>You can now explore courses, enroll, and start learning. If you selected a preferred currency during signup, prices will display accordingly. You can change the currency anytime during checkout.</p>
        <p>If you have any questions, reply to this email and we'll help.</p>
        <p>— PromptCare Academy</p>
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
        <p>— PromptCare Academy</p>
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
        <p>— PromptCare Academy</p>
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
