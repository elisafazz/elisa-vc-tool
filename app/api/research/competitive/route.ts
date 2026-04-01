import { streamResearch } from '@/lib/claude'
import { competitivePrompt } from '@/lib/prompts'
import { writeResearch, readCompany, readSpace, readDeck } from '@/lib/store'

export async function POST(req: Request) {
  const { companyId, description: descriptionOverride } = await req.json()
  if (!companyId) return new Response('companyId required', { status: 400 })

  const company = await readCompany(companyId)
  if (!company) return new Response('company not found', { status: 404 })

  const [space, deckText] = await Promise.all([
    company.spaceId ? readSpace(company.spaceId) : Promise.resolve(null),
    company.pitchDeckPath ? readDeck(companyId) : Promise.resolve(null),
  ])

  const description = descriptionOverride ?? company.description

  const prompt = competitivePrompt(
    company.name,
    description,
    space?.name,
    space?.thesis
  )

  let fullText = ''

  const upstream = await streamResearch(prompt, null, null, deckText)
  const reader = upstream.getReader()
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
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
        await writeResearch({ companyId, type: 'competitive', content: fullText, generatedAt: new Date().toISOString() })
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
