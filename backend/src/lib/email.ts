// Email service using Resend

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(apiKey: string, options: SendEmailOptions): Promise<boolean> {
  if (!apiKey) {
    console.log('[EMAIL SKIP] No RESEND_API_KEY. Would send to:', options.to, '— Subject:', options.subject)
    return true // Skip in local dev
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'VNLF App Explorer <noreply@vietnamlinuxfamily.net>',
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    })
    return res.ok
  } catch {
    console.error('Failed to send email')
    return false
  }
}

export function verifyEmailTemplate(displayName: string, verifyUrl: string, locale: 'vi' | 'en' = 'vi'): { subject: string; html: string } {
  const t = locale === 'vi' ? {
    subject: 'Xác thực email — VNLF App Explorer',
    greeting: `Xin chào ${displayName}!`,
    thanks: 'Cảm ơn bạn đã đăng ký <strong>VNLF App Explorer</strong>.',
    cta: 'Nhấn nút bên dưới để xác thực email:',
    btn: 'Xác thực email',
    alt: 'Hoặc copy link:',
  } : {
    subject: 'Verify your email — VNLF App Explorer',
    greeting: `Hi ${displayName}!`,
    thanks: 'Thank you for signing up for <strong>VNLF App Explorer</strong>.',
    cta: 'Click the button below to verify your email:',
    btn: 'Verify Email',
    alt: 'Or copy this link:',
  }
  return {
    subject: t.subject,
    html: `
      <div style="font-family: 'Be Vietnam Pro', sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #3D6145;">${t.greeting}</h2>
        <p>${t.thanks}</p>
        <p>${t.cta}</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #3D6145; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          ${t.btn}
        </a>
        <p style="margin-top: 1.5rem; color: #666; font-size: 0.85rem;">
          ${t.alt} <br><code>${verifyUrl}</code>
        </p>
        <hr style="border: none; border-top: 1px solid #E3E0D1; margin: 1.5rem 0;">
        <p style="color: #999; font-size: 0.75rem;">Vietnam Linux Family — vietnamlinuxfamily.net</p>
      </div>
    `,
  }
}

export function resetPasswordTemplate(displayName: string, resetUrl: string, locale: 'vi' | 'en' = 'vi'): { subject: string; html: string } {
  const t = locale === 'vi' ? {
    subject: 'Đặt lại mật khẩu — VNLF App Explorer',
    greeting: `Xin chào ${displayName}!`,
    msg: 'Bạn đã yêu cầu đặt lại mật khẩu.',
    btn: 'Đặt lại mật khẩu',
    expires: 'Link có hiệu lực trong 1 giờ.',
  } : {
    subject: 'Reset your password — VNLF App Explorer',
    greeting: `Hi ${displayName}!`,
    msg: 'You requested a password reset.',
    btn: 'Reset Password',
    expires: 'This link expires in 1 hour.',
  }
  return {
    subject: t.subject,
    html: `
      <div style="font-family: 'Be Vietnam Pro', sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #3D6145;">${t.greeting}</h2>
        <p>${t.msg}</p>
        <a href="${resetUrl}" style="display: inline-block; background: #3D6145; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          ${t.btn}
        </a>
        <p style="margin-top: 1rem; color: #666; font-size: 0.85rem;">${t.expires}</p>
        <hr style="border: none; border-top: 1px solid #E3E0D1; margin: 1.5rem 0;">
        <p style="color: #999; font-size: 0.75rem;">Vietnam Linux Family — vietnamlinuxfamily.net</p>
      </div>
    `,
  }
}
