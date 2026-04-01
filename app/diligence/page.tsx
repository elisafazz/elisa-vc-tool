import { listStandaloneCompanies, readResearch } from '@/lib/store'
import DiligenceClient, { type PreviousCompany } from './DiligenceClient'

export const dynamic = 'force-dynamic'

export default async function DiligencePage() {
  const companies = await listStandaloneCompanies()

  const previousCompanies: PreviousCompany[] = await Promise.all(
    companies
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .map(async c => {
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

  // Only show companies that have at least one research result
  const researched = previousCompanies.filter(c => c.hasDd || c.hasCompetitive)

  return <DiligenceClient previousCompanies={researched} />
}
