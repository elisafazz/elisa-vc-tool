import { NextResponse } from 'next/server'
import { listStandaloneCompanies, readResearch } from '@/lib/store'

export async function GET() {
  const companies = await listStandaloneCompanies()

  const results = await Promise.all(
    companies.map(async c => {
      const [dd, competitive] = await Promise.all([
        readResearch(c.id, 'dd'),
        readResearch(c.id, 'competitive'),
      ])
      return {
        id: c.id,
        name: c.name,
        description: c.description,
        addedAt: c.addedAt,
        hasDd: !!dd,
        hasCompetitive: !!competitive,
      }
    })
  )

  // Return only companies with at least one research result, sorted newest first
  return NextResponse.json(
    results
      .filter(c => c.hasDd || c.hasCompetitive)
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
  )
}
