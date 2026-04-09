import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/claude'
import { dealFlowPrompt } from '@/lib/prompts'
import { writeDealFlow } from '@/lib/store'
import type { DealFlowEntry } from '@/lib/types'

interface BatchItem {
  deckText: string
  fileName: string
  personInCharge: string
  contactBackground: string
  firstContacted: string
  notes: string
}

export async function POST(req: NextRequest) {
  try {
    const { items } = (await req.json()) as { items: BatchItem[] }

    if (!items?.length) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    if (items.length > 20) {
      return NextResponse.json({ error: 'Maximum 20 files per batch' }, { status: 400 })
    }

    const results: { fileName: string; entry?: DealFlowEntry; error?: string }[] = []

    for (const item of items) {
      if (!item.deckText?.trim()) {
        results.push({ fileName: item.fileName, error: 'Empty deck text' })
        continue
      }

      try {
        const notesBlock = item.notes?.trim()
          ? `\n\nAdditional analyst notes:\n${item.notes.trim()}`
          : ''

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: `Pitch deck content:\n\n${item.deckText.trim()}${notesBlock}` },
                { type: 'text', text: dealFlowPrompt() },
              ],
            },
          ],
        })

        const rawText = response.content
          .filter(b => b.type === 'text')
          .map(b => (b as { type: 'text'; text: string }).text)
          .join('')

        const match = rawText.match(/\{[\s\S]*\}/)
        if (!match) {
          results.push({ fileName: item.fileName, error: 'No JSON in Claude response' })
          continue
        }

        const extracted = JSON.parse(match[0]) as Record<string, unknown>

        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const entry: DealFlowEntry = {
          id,
          createdAt: new Date().toISOString(),
          companyName: (extracted.companyName as string) || 'Unknown',
          firstContacted: item.firstContacted || new Date().toISOString().slice(0, 10),
          overview: (extracted.overview as string) || '',
          tag: (extracted.tag as string | null) ?? null,
          country: (extracted.country as string | null) ?? null,
          jobTitleName: (extracted.jobTitleName as string | null) ?? null,
          bioClassification: (extracted.bioClassification as string | null) ?? null,
          bioDiseaseArea: (extracted.bioDiseaseArea as string | null) ?? null,
          bioModality: (extracted.bioModality as string | null) ?? null,
          nextSeries: (extracted.nextSeries as string | null) ?? null,
          stage: (extracted.stage as string | null) ?? null,
          personInCharge: item.personInCharge || '',
          status: 'Contacted',
          websiteUrl: (extracted.websiteUrl as string | null) ?? null,
          contactBackground: item.contactBackground || '',
        }

        await writeDealFlow(entry)
        results.push({ fileName: item.fileName, entry })
      } catch (err) {
        results.push({
          fileName: item.fileName,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({ results })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
