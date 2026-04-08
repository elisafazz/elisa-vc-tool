import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/claude'
import { dealFlowPrompt } from '@/lib/prompts'
import { writeDealFlow } from '@/lib/store'
import type { DealFlowEntry } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { deckText, personInCharge, contactBackground, firstContacted } = await req.json()

    if (!deckText?.trim()) {
      return NextResponse.json({ error: 'Pitch deck text is required' }, { status: 400 })
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `Pitch deck content:\n\n${deckText.trim()}` },
            { type: 'text', text: dealFlowPrompt() },
          ],
        },
      ],
    })

    const rawText = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    let extracted: Record<string, unknown>
    try {
      const match = rawText.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No JSON found')
      extracted = JSON.parse(match[0])
    } catch {
      return NextResponse.json({ error: 'Failed to parse Claude response' }, { status: 500 })
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const entry: DealFlowEntry = {
      id,
      createdAt: new Date().toISOString(),
      companyName: (extracted.companyName as string) || 'Unknown',
      firstContacted: firstContacted || new Date().toISOString().slice(0, 10),
      overview: (extracted.overview as string) || '',
      tag: (extracted.tag as string | null) ?? null,
      country: (extracted.country as string | null) ?? null,
      jobTitleName: (extracted.jobTitleName as string | null) ?? null,
      bioClassification: (extracted.bioClassification as string | null) ?? null,
      bioDiseaseArea: (extracted.bioDiseaseArea as string | null) ?? null,
      bioModality: (extracted.bioModality as string | null) ?? null,
      nextSeries: (extracted.nextSeries as string | null) ?? null,
      stage: (extracted.stage as string | null) ?? null,
      personInCharge: personInCharge || '',
      status: 'Contacted',
      websiteUrl: (extracted.websiteUrl as string | null) ?? null,
      contactBackground: contactBackground || '',
    }

    await writeDealFlow(entry)

    return NextResponse.json({ entry })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
