import { streamResearch } from '@/lib/claude'
import { ddPrompt, competitivePrompt } from '@/lib/prompts'

// Standalone research — no companyId required, works from the Diligence page
export async function POST(req: Request) {
  const { companyName, description, type, spaceName, thesis } = await req.json()

  if (!companyName?.trim()) return new Response('companyName required', { status: 400 })
  if (type !== 'dd' && type !== 'competitive') return new Response('type must be dd or competitive', { status: 400 })

  const prompt =
    type === 'dd'
      ? ddPrompt(companyName, description)
      : competitivePrompt(companyName, description, spaceName, thesis)

  const upstream = await streamResearch(prompt)
  const reader = upstream.getReader()
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        controller.enqueue(value)
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
