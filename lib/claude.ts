import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

type MessageParam = Anthropic.Messages.MessageParam
type ContentBlockParam = Anthropic.Messages.ContentBlockParam

function buildUserContent(
  prompt: string,
  pdfPath?: string | null,
  pdfBase64?: string | null,
  deckText?: string | null
): ContentBlockParam[] {
  const blocks: ContentBlockParam[] = []

  if (deckText) {
    blocks.push({ type: 'text', text: `Pitch deck content:\n\n${deckText}` })
  } else if (pdfBase64) {
    blocks.push({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
    } as ContentBlockParam)
  } else if (pdfPath) {
    try {
      if (pdfPath.endsWith('.txt')) {
        const txtContent = fs.readFileSync(pdfPath, 'utf-8')
        blocks.push({ type: 'text', text: `Pitch deck content:\n\n${txtContent}` })
      } else {
        const pdfBytes = fs.readFileSync(pdfPath)
        const base64 = pdfBytes.toString('base64')
        blocks.push({
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        } as ContentBlockParam)
      }
    } catch {
      // file unavailable - continue without it
    }
  }

  blocks.push({ type: 'text', text: prompt })
  return blocks
}

// Returns a ReadableStream of SSE chunks for streaming to the client
export async function streamResearch(
  prompt: string,
  pdfPath?: string | null,
  pdfBase64?: string | null,
  deckText?: string | null
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder()
  const content = buildUserContent(prompt, pdfPath, pdfBase64, deckText)

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

// Generate clarifying questions to refine an investment space thesis
export async function generateSpaceQuestions(
  spaceName: string,
  description: string
): Promise<string[]> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are helping a VC analyst set up an investment tracking space.

Space name: ${spaceName}
${description ? `Initial description: ${description}` : ''}

Ask 3 concise, targeted clarifying questions to help sharpen the investment thesis for this space. Questions should surface specifics like: stage preference, geography, technology differentiation angle, key problem being solved, competitive moat, excluded sub-segments.

Return ONLY a JSON array of 3 question strings. No explanation. Example:
["Question one?", "Question two?", "Question three?"]`,
    }],
  })
  const text = response.content.filter(b => b.type === 'text').map(b => (b as {type:'text';text:string}).text).join('')
  try {
    const match = text.match(/\[[\s\S]*\]/)
    if (match) return JSON.parse(match[0]) as string[]
  } catch {}
  return []
}

// Generate a refined investment thesis from Q&A
export async function generateRefinedThesis(
  spaceName: string,
  description: string,
  qa: Array<{ q: string; a: string }>
): Promise<string> {
  const qaBlock = qa.map(({ q, a }) => `Q: ${q}\nA: ${a}`).join('\n\n')
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Based on the following context, write a concise investment thesis (2-4 sentences) for this VC deal flow space. The thesis will be used to instruct an AI to source companies - be specific and actionable.

Space: ${spaceName}
${description ? `Description: ${description}` : ''}

${qaBlock}

Return only the thesis text. No labels, no JSON.`,
    }],
  })
  return response.content.filter(b => b.type === 'text').map(b => (b as {type:'text';text:string}).text).join('').trim()
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
