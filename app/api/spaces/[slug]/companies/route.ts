import { NextResponse } from 'next/server'
import { listCompanies } from '@/lib/store'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const companies = listCompanies(slug).sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  )
  return NextResponse.json(companies)
}
