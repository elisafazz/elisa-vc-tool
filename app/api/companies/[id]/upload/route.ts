import { NextRequest } from 'next/server'
import { readCompany, writeCompany, writeDeck } from '@/lib/store'

const TXT_LIMIT = 1 * 1024 * 1024

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const company = await readCompany(id)
  if (!company) return Response.json({ error: 'company not found' }, { status: 404 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return Response.json({ error: 'no file' }, { status: 400 })

  const isTxt = file.type === 'text/plain' || file.name.endsWith('.txt')
  if (!isTxt) return Response.json({ error: 'Only .txt files accepted' }, { status: 400 })
  if (file.size > TXT_LIMIT) return Response.json({ error: 'File too large (max 1 MB)' }, { status: 413 })

  const text = await file.text()
  await Promise.all([
    writeDeck(company.id, text),
    writeCompany({ ...company, pitchDeckPath: file.name }),
  ])

  return Response.json({ ok: true })
}
