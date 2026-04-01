import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: Request) {
  const { description, reporterEmail, page } = await req.json()
  if (!description?.trim()) return NextResponse.json({ error: 'description required' }, { status: 400 })

  const to = process.env.ALERT_EMAIL
  if (!to) return NextResponse.json({ error: 'ALERT_EMAIL not configured' }, { status: 500 })

  const resend = new Resend(process.env.RESEND_API_KEY)

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="background:#030712;color:#e2e8f0;font-family:system-ui,sans-serif;padding:32px;max-width:600px;margin:0 auto">
      <h2 style="color:#f8fafc;font-size:18px;margin-bottom:4px">FTI - Bug Report</h2>
      <p style="color:#6b7280;font-size:13px;margin-top:0">${new Date().toLocaleString()}</p>
      <hr style="border:none;border-top:1px solid #1f2937;margin:16px 0">
      <p style="font-size:13px;color:#9ca3af;margin:0 0 4px">Description</p>
      <p style="font-size:15px;color:#f1f5f9;white-space:pre-wrap;margin:0 0 20px">${description.trim()}</p>
      ${reporterEmail ? `<p style="font-size:13px;color:#9ca3af;margin:0 0 4px">Reporter</p><p style="font-size:14px;color:#e2e8f0;margin:0 0 20px">${reporterEmail}</p>` : ''}
      ${page ? `<p style="font-size:13px;color:#9ca3af;margin:0 0 4px">Page</p><p style="font-size:14px;color:#e2e8f0;margin:0">${page}</p>` : ''}
    </body>
    </html>
  `

  await resend.emails.send({
    from: 'FTI Bug Report <noreply@elisafazzari.com>',
    to,
    subject: `FTI Bug Report - ${description.trim().slice(0, 60)}${description.trim().length > 60 ? '...' : ''}`,
    html,
  })

  return NextResponse.json({ ok: true })
}
