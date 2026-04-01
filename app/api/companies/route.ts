import { NextResponse } from 'next/server'
import { writeCompany, readCompany } from '@/lib/store'
import type { Company, CompanyStatus } from '@/lib/types'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  const body = await req.json()
  const { name, spaceId, website, stage, oneLiner, status } = body

  if (!name?.trim() || !spaceId) {
    return NextResponse.json({ error: 'name and spaceId are required' }, { status: 400 })
  }

  const company: Company = {
    id: randomUUID(),
    name: name.trim(),
    spaceId,
    website: website?.trim() || null,
    stage: stage?.trim() || null,
    oneLiner: oneLiner?.trim() || null,
    description: null,
    pitchDeckPath: null,
    status: (status as CompanyStatus) ?? 'Sourced',
    addedAt: new Date().toISOString(),
    seenAt: null,
    source: 'manual',
  }

  await writeCompany(company)
  return NextResponse.json(company, { status: 201 })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const existing = await readCompany(id)
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const updated: Company = { ...existing, ...updates }
  await writeCompany(updated)
  return NextResponse.json(updated)
}
