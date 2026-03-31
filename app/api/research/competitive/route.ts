import { streamResearch } from '@/lib/claude'
import { competitivePrompt } from '@/lib/prompts'
import { writeResearch, readCompany, readSpace } from '@/lib/store'

export async function POST(req: Request) {
  const { companyId } = await req.json()
  if (!companyId) return new Response('companyId required', { status: 400 })

  const company = readCompany(companyId)
  if (!company) return new Response('company not found', { status: 404 })

  const space = readSpace(company.spaceId)
  const spaceName = space?.name ?? 'this space'
  const thesis = space?.thesis

  const prompt = competitivePrompt(company.name, spaceName, thesis)
  let fullText = ''

  const upstream = await streamResearch(prompt)
  const reader = upstream.getReader()
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = new TextDecoder().decode(value)
        const match = chunk.match(/data: ({.*})/g)
        if (match) {
          for (const m of match) {
            try {
              const parsed = JSON.parse(m.replace('data: ', ''))
              if (parsed.text) fullText += parsed.text
            } catch {}
          }
        }
        controller.enqueue(value)
      }
      if (fullText) {
        writeResearch({
          companyId,
          type: 'competitive',
          content: fullText,
          generatedAt: new Date().toISOString(),
        })
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
