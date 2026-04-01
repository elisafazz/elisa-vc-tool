import { NextResponse } from 'next/server'
import { streamResearch } from '@/lib/claude'
import { ddPrompt, competitivePrompt } from '@/lib/prompts'
import { findCompanyByName, writeCompany, writeResearch, readCompany } from '@/lib/store'
import type { Company } from '@/lib/types'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') ?? ''
  let companyName = '', description = '', type = '', spaceName = '', thesis = ''
  let existingCompanyId: string | null = null
  let pdfBase64: string | null = null
  let deckText: string | null = null

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    companyName = (form.get('companyName') as string) ?? ''
    description = (form.get('description') as string) ?? ''
    type = (form.get('type') as string) ?? ''
    spaceName = (form.get('spaceName') as string) ?? ''
    thesis = (form.get('thesis') as string) ?? ''
    existingCompanyId = (form.get('companyId') as string) || null
    const file = form.get('pdf') as File | null
    if (file) {
      if (file.type === 'application/pdf') {
        const bytes = await file.arrayBuffer()
        pdfBase64 = Buffer.from(bytes).toString('base64')
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        deckText = await file.text()
      }
    }
  } else {
    const body = await req.json()
    companyName = body.companyName ?? ''
    description = body.description ?? ''
    type = body.type ?? ''
    spaceName = body.spaceName ?? ''
    thesis = body.thesis ?? ''
    existingCompanyId = body.companyId ?? null
  }

  if (!companyName.trim()) return new Response('companyName required', { status: 400 })
  if (type !== 'dd' && type !== 'competitive') return new Response('type must be dd or competitive', { status: 400 })

  // Find or create standalone company record
  let company: Company | null = existingCompanyId ? await readCompany(existingCompanyId) : null
  if (!company) company = await findCompanyByName(companyName.trim())

  if (!company) {
    company = {
      id: randomUUID(),
      name: companyName.trim(),
      spaceId: null,
      website: null,
      stage: null,
      oneLiner: null,
      description: description.trim() || null,
      pitchDeckPath: null,
      status: 'Sourced',
      addedAt: new Date().toISOString(),
      seenAt: new Date().toISOString(),
      source: 'standalone',
    }
    await writeCompany(company)
  } else if (description.trim() && !company.description) {
    company = { ...company, description: description.trim() }
    await writeCompany(company)
  }

  const companyId = company.id

  const prompt =
    type === 'dd'
      ? ddPrompt(companyName, description || company.description)
      : competitivePrompt(companyName, description || company.description, spaceName, thesis)

  let upstream: ReadableStream<Uint8Array>
  try {
    upstream = await streamResearch(prompt, null, pdfBase64, deckText)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    const isCredits = msg.toLowerCase().includes('credit') || msg.toLowerCase().includes('billing') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('insufficient')
    return NextResponse.json(
      { error: isCredits ? 'API credits exhausted. Add credits at console.anthropic.com.' : `API error: ${msg}` },
      { status: 402 }
    )
  }
  const reader = upstream.getReader()
  const encoder = new TextEncoder()

  let fullText = ''

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Emit companyId as first event so client can track it
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ companyId })}\n\n`))

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = new TextDecoder().decode(value)
        const matches = chunk.match(/data: ({.*})/g)
        if (matches) {
          for (const m of matches) {
            try {
              const parsed = JSON.parse(m.replace('data: ', ''))
              if (parsed.text) fullText += parsed.text
            } catch {}
          }
        }
        controller.enqueue(value)
      }

      if (fullText) {
        await writeResearch({ companyId, type: type as 'dd' | 'competitive', content: fullText, generatedAt: new Date().toISOString() })
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
