import { NextResponse } from 'next/server'
import { listSpaces, writeSpace } from '@/lib/store'
import type { Space } from '@/lib/types'
import { randomUUID } from 'crypto'

export async function GET() {
  const spaces = listSpaces().sort(
    (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
  )
  return NextResponse.json(spaces)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { name, description, thesis } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const space: Space = {
    id: randomUUID(),
    name: name.trim(),
    description: description?.trim() ?? '',
    thesis: thesis?.trim() ?? '',
    created: new Date().toISOString(),
    lastSourcedAt: null,
  }

  writeSpace(space)
  return NextResponse.json(space, { status: 201 })
}
