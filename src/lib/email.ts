type EmailPayload = {
  to?: string | string[] | null
  subject: string
  html: string
  text?: string
  idempotencyKey?: string
}

export async function sendLbidEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY
  const to = Array.isArray(payload.to) ? payload.to.filter(Boolean) : payload.to ? [payload.to] : []

  if (!apiKey || to.length === 0) {
    return { sent: false, skipped: true, reason: !apiKey ? "RESEND_NOT_CONFIGURED" : "NO_RECIPIENT" }
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      ...(payload.idempotencyKey ? { "Idempotency-Key": payload.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: process.env.LBID_EMAIL_FROM || "LBID <onboarding@resend.dev>",
      to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) return { sent: false, error: body.error || body.message || "EMAIL_SEND_FAILED" }
  return { sent: true, id: body.id }
}

export function renderSimpleEmail({ title, body, ctaHref, ctaLabel }: { title: string; body: string; ctaHref?: string; ctaLabel?: string }) {
  const cta = ctaHref && ctaLabel
    ? `<p style="margin:24px 0"><a href="${escapeHtml(ctaHref)}" style="background:#1B2B5E;color:#fff;text-decoration:none;border-radius:8px;padding:12px 16px;font-weight:700">${escapeHtml(ctaLabel)}</a></p>`
    : ""

  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#f6f8fb;padding:32px;color:#1B2B5E">
      <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:28px">
        <div style="font-size:22px;font-weight:900;letter-spacing:4px;margin-bottom:20px">LBID</div>
        <h1 style="font-size:24px;line-height:1.2;margin:0 0 12px">${escapeHtml(title)}</h1>
        <p style="font-size:15px;line-height:1.7;color:#475569;margin:0">${escapeHtml(body)}</p>
        ${cta}
        <p style="font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:16px;margin-top:24px">
          LBID is a workflow platform and not the carrier of record.
        </p>
      </div>
    </div>
  `
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
