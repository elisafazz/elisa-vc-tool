import { NextResponse } from 'next/server'
import { listSpaces, listCompanies, writeSpace } from '@/lib/store'
import { runResearch } from '@/lib/claude'
import { spaceNewsPrompt } from '@/lib/prompts'
import { sendSpaceNewsDigest } from '@/lib/resend'

export async function POST(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const spaces = listSpaces().filter(s => s.alertsEnabled && s.alertEmail)
  const results: Array<{ space: string; sent: boolean; error?: string }> = []

  for (const space of spaces) {
    try {
      const companies = listCompanies(space.id)
      const prompt = spaceNewsPrompt(space.name, space.thesis, companies.map(c => c.name))
      const newsContent = await runResearch(prompt)

      await sendSpaceNewsDigest(space, newsContent, space.alertEmail!)
      writeSpace({ ...space, lastAlertAt: new Date().toISOString() })
      results.push({ space: space.name, sent: true })
    } catch (err) {
      console.error(`Alert failed for space ${space.name}:`, err)
      results.push({ space: space.name, sent: false, error: String(err) })
    }
  }

  return NextResponse.json({ results, ran: spaces.length })
}
