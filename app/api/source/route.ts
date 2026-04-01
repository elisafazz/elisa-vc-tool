import { NextResponse } from 'next/server'
import { runResearch } from '@/lib/claude'
import { sourcingPrompt } from '@/lib/prompts'
import { readSpace, writeSpace, listCompanies, writeCompany } from '@/lib/store'
import type { Company } from '@/lib/types'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  const { spaceId } = await req.json()
  if (!spaceId) return NextResponse.json({ error: 'spaceId required' }, { status: 400 })

  const space = await readSpace(spaceId)
  if (!space) return NextResponse.json({ error: 'space not found' }, { status: 404 })

  const existing = await listCompanies(spaceId)
  const existingNames = existing.map(c => c.name.toLowerCase())

  const prompt = sourcingPrompt(space.name, space.thesis, existing.map(c => c.name))
  const raw = await runResearch(prompt)

  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    return NextResponse.json({ error: 'no structured response from AI', raw }, { status: 500 })
  }

  let sourced: Array<{ name: string; website: string | null; oneLiner: string | null; stage: string | null }>
  try {
    sourced = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: 'failed to parse AI response', raw }, { status: 500 })
  }

  const newCompanies: Company[] = []
  for (const item of sourced) {
    if (!item.name) continue
    if (existingNames.includes(item.name.toLowerCase())) continue

    const company: Company = {
      id: randomUUID(),
      name: item.name,
      spaceId,
      website: item.website || null,
      stage: item.stage || null,
      oneLiner: item.oneLiner || null,
      description: null,
      pitchDeckPath: null,
      status: 'Sourced',
      addedAt: new Date().toISOString(),
      seenAt: null,
      source: 'sourced',
    }
    await writeCompany(company)
    newCompanies.push(company)
  }

  await writeSpace({ ...space, lastSourcedAt: new Date().toISOString() })

  return NextResponse.json({ added: newCompanies.length, companies: newCompanies })
}
