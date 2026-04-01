import { Resend } from 'resend'
import type { Company, Space } from './types'

export async function sendSpaceNewsDigest(space: Space, newsContent: string, toEmail: string): Promise<void> {
  if (!toEmail) throw new Error('No email address for space news digest')

  // Convert markdown-ish content to simple HTML
  const htmlBody = newsContent
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^## (.+)$/gm, '<h3 style="color:#f8fafc;font-size:16px;margin:20px 0 6px">$1</h3>')
    .replace(/^### (.+)$/gm, '<h4 style="color:#e2e8f0;font-size:14px;margin:14px 0 4px">$1</h4>')
    .replace(/^- (.+)$/gm, '<li style="margin-bottom:6px;color:#d1d5db">$1</li>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" style="color:#ef4444">$1</a>')
    .replace(/\n{2,}/g, '</p><p style="margin:8px 0">')

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="background:#030712;color:#e2e8f0;font-family:system-ui,sans-serif;padding:32px;max-width:640px;margin:0 auto">
      <h1 style="color:#f8fafc;font-size:22px;margin-bottom:4px">FTI — ${space.name} Weekly Digest</h1>
      <p style="color:#6b7280;font-size:14px;margin-top:0">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
      ${space.thesis ? `<p style="color:#9ca3af;font-size:13px;font-style:italic;border-left:2px solid #374151;padding-left:12px;margin:16px 0">${space.thesis}</p>` : ''}
      <hr style="border:none;border-top:1px solid #1f2937;margin:20px 0">
      <div style="font-size:14px;line-height:1.7;color:#d1d5db">
        <p style="margin:8px 0">${htmlBody}</p>
      </div>
      <hr style="border:none;border-top:1px solid #1f2937;margin:20px 0">
      <p style="color:#4b5563;font-size:12px">FTI Research Tool — weekly space digest</p>
    </body>
    </html>
  `

  const resend = getResend()
  await resend.emails.send({
    from: 'FTI Alerts <noreply@elisafazzari.com>',
    to: toEmail,
    subject: `FTI — ${space.name} Weekly Digest`,
    html,
  })
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendAlertDigest(
  newCompaniesBySpace: Array<{ space: Space; companies: Company[] }>
): Promise<void> {
  const to = process.env.ALERT_EMAIL
  if (!to) throw new Error('ALERT_EMAIL not set')

  const totalNew = newCompaniesBySpace.reduce((sum, { companies }) => sum + companies.length, 0)
  if (totalNew === 0) return

  const htmlSections = newCompaniesBySpace
    .filter(({ companies }) => companies.length > 0)
    .map(({ space, companies }) => {
      const items = companies.map(c => {
        const link = c.website ? `<a href="${c.website}" style="color:#f59e0b">${c.name}</a>` : c.name
        const stage = c.stage ? ` — ${c.stage}` : ''
        const desc = c.oneLiner ? `<br><span style="color:#9ca3af;font-size:13px">${c.oneLiner}</span>` : ''
        return `<li style="margin-bottom:8px">${link}${stage}${desc}</li>`
      }).join('')

      return `
        <h3 style="color:#f8fafc;font-size:16px;margin:20px 0 8px">${space.name}</h3>
        <ul style="padding-left:20px;margin:0">${items}</ul>
      `
    }).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="background:#030712;color:#e2e8f0;font-family:system-ui,sans-serif;padding:32px;max-width:600px;margin:0 auto">
      <h1 style="color:#f8fafc;font-size:22px;margin-bottom:4px">FTI — New Companies</h1>
      <p style="color:#6b7280;font-size:14px;margin-top:0">${totalNew} new ${totalNew === 1 ? 'company' : 'companies'} sourced today</p>
      <hr style="border:none;border-top:1px solid #1f2937;margin:20px 0">
      ${htmlSections}
      <hr style="border:none;border-top:1px solid #1f2937;margin:20px 0">
      <p style="color:#4b5563;font-size:12px">FTI Deal Flow Tool</p>
    </body>
    </html>
  `

  const resend = getResend()
  await resend.emails.send({
    from: 'FTI Deal Flow <noreply@elisafazzari.com>',
    to,
    subject: `FTI — ${totalNew} new ${totalNew === 1 ? 'company' : 'companies'} sourced`,
    html,
  })
}
