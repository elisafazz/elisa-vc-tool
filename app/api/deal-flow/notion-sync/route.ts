import { NextRequest, NextResponse } from 'next/server'
import { readDealFlow, writeDealFlow } from '@/lib/store'
import { createDealFlowPage, pageExists } from '@/lib/notion'

export async function POST(req: NextRequest) {
  try {
    const { entryId } = await req.json()
    if (!entryId || typeof entryId !== 'string') {
      return NextResponse.json({ error: 'entryId is required' }, { status: 400 })
    }

    const entry = await readDealFlow(entryId)
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (entry.notionPageId && entry.notionPageUrl) {
      const exists = await pageExists(entry.notionPageId)
      if (exists) {
        return NextResponse.json({
          notionPageId: entry.notionPageId,
          notionPageUrl: entry.notionPageUrl,
        })
      }
      entry.notionPageId = null
      entry.notionPageUrl = null
    }

    let created: { id: string; url: string }
    try {
      created = await createDealFlowPage(entry)
    } catch (err: any) {
      const status = err?.status ?? err?.code ?? 502
      const message = err?.body?.message ?? err?.message ?? 'Notion request failed'
      return NextResponse.json(
        { error: `Notion API error (${status}): ${message}` },
        { status: 502 },
      )
    }

    const updated = { ...entry, notionPageId: created.id, notionPageUrl: created.url }
    await writeDealFlow(updated)

    return NextResponse.json({
      notionPageId: created.id,
      notionPageUrl: created.url,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
