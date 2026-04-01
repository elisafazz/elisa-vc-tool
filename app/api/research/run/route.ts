import { streamResearch } from '@/lib/claude'
import { ddPrompt, competitivePrompt } from '@/lib/prompts'

// Standalone research — accepts multipart/form-data so a PDF can be uploaded inline
export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') ?? ''
  let companyName = '', description = '', type = '', spaceName = '', thesis = ''
  let pdfBase64: string | null = null

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    companyName = (form.get('companyName') as string) ?? ''
    description = (form.get('description') as string) ?? ''
    type = (form.get('type') as string) ?? ''
    spaceName = (form.get('spaceName') as string) ?? ''
    thesis = (form.get('thesis') as string) ?? ''
    const file = form.get('pdf') as File | null
    if (file && file.type === 'application/pdf') {
      const bytes = await file.arrayBuffer()
      pdfBase64 = Buffer.from(bytes).toString('base64')
    }
  } else {
    const body = await req.json()
    companyName = body.companyName ?? ''
    description = body.description ?? ''
    type = body.type ?? ''
    spaceName = body.spaceName ?? ''
    thesis = body.thesis ?? ''
  }

  if (!companyName.trim()) return new Response('companyName required', { status: 400 })
  if (type !== 'dd' && type !== 'competitive') return new Response('type must be dd or competitive', { status: 400 })

  const prompt =
    type === 'dd'
      ? ddPrompt(companyName, description)
      : competitivePrompt(companyName, description, spaceName, thesis)

  const upstream = await streamResearch(prompt, null, pdfBase64)
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
