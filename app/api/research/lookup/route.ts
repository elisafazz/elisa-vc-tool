import { NextResponse } from 'next/server'
import { findCompanyByName, readResearch } from '@/lib/store'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')
  if (!name) return NextResponse.json(null)

  const company = findCompanyByName(name)
  if (!company) return NextResponse.json(null)

  const dd = readResearch(company.id, 'dd')
  const competitive = readResearch(company.id, 'competitive')

  return NextResponse.json({
    company,
    dd: dd?.content ?? null,
    competitive: competitive?.content ?? null,
  })
}
