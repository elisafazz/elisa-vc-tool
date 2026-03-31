import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

type MessageParam = Anthropic.Messages.MessageParam
type ContentBlockParam = Anthropic.Messages.ContentBlockParam

function buildUserContent(prompt: string, pdfPath?: string | null): ContentBlockParam[] {
  const blocks: ContentBlockParam[] = []

  if (pdfPath) {
    try {
      const pdfBytes = fs.readFileSync(pdfPath)
      const base64 = pdfBytes.toString('base64')
      blocks.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: base64,
        },
      } as ContentBlockParam)
    } catch {
      // PDF unavailable — continue without it
    }
  }

  blocks.push({ type: 'text', text: prompt })
  return blocks
}

// Returns a ReadableStream of SSE chunks for streaming to the client
export async function streamResearch(
  prompt: string,
  pdfPath?: string | null
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder()
  const content = buildUserContent(prompt, pdfPath)

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 8096,
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
      },
    ],
    messages: [{ role: 'user', content } as MessageParam],
  })

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
            )
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })
}

// Non-streaming: returns full text (used for sourcing)
export async function runResearch(prompt: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
      },
    ],
    messages: [{ role: 'user', content: prompt }],
  })

  return response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('\n')
}
