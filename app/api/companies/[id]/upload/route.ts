import { NextRequest } from 'next/server'
import { readCompany, writeCompany } from '@/lib/store'
import fs from 'fs'
import path from 'path'

const DATA_DIR = process.env.DATA_DIR ?? '/tmp/fti-data'
const PDF_LIMIT = 3 * 1024 * 1024
const TXT_LIMIT = 1 * 1024 * 1024

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const company = readCompany(id)
  if (!company) return Response.json({ error: 'company not found' }, { status: 404 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return Response.json({ error: 'no file' }, { status: 400 })

  const isPdf = file.type === 'application/pdf'
  const isTxt = file.type === 'text/plain' || file.name.endsWith('.txt')

  if (!isPdf && !isTxt) {
    return Response.json({ error: 'Only PDF or .txt files accepted' }, { status: 400 })
  }
  if (isPdf && file.size > PDF_LIMIT) {
    return Response.json({ error: 'PDF too large (max 3 MB)' }, { status: 413 })
  }
  if (isTxt && file.size > TXT_LIMIT) {
    return Response.json({ error: 'Text file too large (max 1 MB)' }, { status: 413 })
  }

  const ext = isPdf ? '.pdf' : '.txt'
  const filename = `deck-${company.id}${ext}`
  const filePath = path.join(DATA_DIR, filename)

  const bytes = await file.arrayBuffer()
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(filePath, Buffer.from(bytes))

  writeCompany({ ...company, pitchDeckPath: filePath })
  return Response.json({ ok: true })
}
