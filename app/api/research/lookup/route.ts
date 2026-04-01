import { NextResponse } from 'next/server'
import { findCompanyByName, readResearch } from '@/lib/store'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')
  if (!name) return NextResponse.json(null)

  const company = await findCompanyByName(name)
  if (!company) return NextResponse.json(null)

  const [dd, competitive] = await Promise.all([
    readResearch(company.id, 'dd'),
    readResearch(company.id, 'competitive'),
  ])

  return NextResponse.json({
    company,
    dd: dd?.content ?? null,
    competitive: competitive?.content ?? null,
  })
}
