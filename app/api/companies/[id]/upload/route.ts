import { NextResponse } from 'next/server'
import { readCompany, writeCompany } from '@/lib/store'
import fs from 'fs'
import path from 'path'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const company = readCompany(id)
  if (!company) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'no file' }, { status: 400 })
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'only PDF files accepted' }, { status: 400 })
  }

  const uploadsDir = path.join(process.env.DATA_DIR ?? '/tmp/fti-data', 'uploads')
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

  const destPath = path.join(uploadsDir, `${id}.pdf`)
  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(destPath, buffer)

  const updated = { ...company, pitchDeckPath: destPath }
  writeCompany(updated)

  return NextResponse.json({ path: destPath })
}
