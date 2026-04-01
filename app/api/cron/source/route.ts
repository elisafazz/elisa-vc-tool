import { NextResponse } from 'next/server'
import { listSpaces, listCompanies, writeCompany, writeSpace, appendAlertLog } from '@/lib/store'
import { runResearch } from '@/lib/claude'
import { sourcingPrompt } from '@/lib/prompts'
import { sendAlertDigest } from '@/lib/resend'
import type { Company } from '@/lib/types'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const spaces = await listSpaces()
  const results: Array<{ space: string; added: number }> = []
  const digestInput: Array<{ space: (typeof spaces)[0]; companies: Company[] }> = []

  for (const space of spaces) {
    const existing = await listCompanies(space.id)
    const prompt = sourcingPrompt(space.name, space.thesis, existing.map(c => c.name))

    try {
      const raw = await runResearch(prompt)
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      if (!jsonMatch) continue

      const sourced: Array<{ name: string; website: string | null; oneLiner: string | null; stage: string | null }> = JSON.parse(jsonMatch[0])
      const existingNames = existing.map(c => c.name.toLowerCase())
      const newCompanies: Company[] = []

      for (const item of sourced) {
        if (!item.name || existingNames.includes(item.name.toLowerCase())) continue
        const company: Company = {
          id: randomUUID(),
          name: item.name,
          spaceId: space.id,
          website: item.website || null,
          stage: item.stage || null,
          oneLiner: item.oneLiner || null,
          description: null,
          pitchDeckPath: null,
          status: 'Sourced',
          addedAt: new Date().toISOString(),
          seenAt: null,
          source: 'sourced',
        }
        await writeCompany(company)
        newCompanies.push(company)
      }

      await writeSpace({ ...space, lastSourcedAt: new Date().toISOString() })
      results.push({ space: space.name, added: newCompanies.length })

      if (newCompanies.length > 0) {
        digestInput.push({ space, companies: newCompanies })
        await appendAlertLog({
          spaceId: space.id,
          spaceName: space.name,
          companyIds: newCompanies.map(c => c.id),
          timestamp: new Date().toISOString(),
          emailSent: false,
        })
      }
    } catch (err) {
      console.error(`Sourcing failed for space ${space.name}:`, err)
    }
  }

  let emailSent = false
  if (digestInput.length > 0) {
    try {
      await sendAlertDigest(digestInput)
      emailSent = true
    } catch (err) {
      console.error('Email digest failed:', err)
    }
  }

  return NextResponse.json({ results, emailSent })
}
