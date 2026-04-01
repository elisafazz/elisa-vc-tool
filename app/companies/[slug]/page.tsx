import { notFound } from 'next/navigation'
import { readCompany, readSpace, readResearch, writeCompany } from '@/lib/store'
import Link from 'next/link'
import ResearchPanel from '@/components/ResearchPanel'
import StatusBadge from '@/components/StatusBadge'

export const dynamic = 'force-dynamic'

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const company = readCompany(slug)
  if (!company) notFound()

  // Mark as seen on server
  if (!company.seenAt) {
    writeCompany({ ...company, seenAt: new Date().toISOString() })
  }

  const space = company.spaceId ? readSpace(company.spaceId) : null
  const ddResearch = readResearch(company.id, 'dd')
  const competitiveResearch = readResearch(company.id, 'competitive')

  return (
    <main className="h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-sm text-white/40 mb-3">
          <Link href="/" className="hover:text-white/60 transition-colors">Deal Flow</Link>
          <span className="text-white/20">/</span>
          {space && (
            <>
              <Link href={`/spaces/${space.id}`} className="hover:text-white/60 transition-colors">{space.name}</Link>
              <span className="text-white/20">/</span>
            </>
          )}
          <span className="text-white/60">{company.name}</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl text-white" style={{ letterSpacing: '-0.3px' }}>
                {company.name}
              </h1>
              <StatusBadge status={company.status} />
            </div>
            <div className="flex items-center gap-4 mt-1">
              {company.stage && <span className="text-white/40 text-sm">{company.stage}</span>}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-500/70 text-xs hover:text-red-500 transition-colors"
                >
                  {company.website}
                </a>
              )}
            </div>
            {company.oneLiner && (
              <p className="text-white/50 text-sm mt-2">{company.oneLiner}</p>
            )}
          </div>
        </div>
      </div>

      {/* Research panel */}
      <div className="flex-1 overflow-hidden">
        <ResearchPanel
          company={company}
          savedDD={ddResearch?.content ?? null}
          savedCompetitive={competitiveResearch?.content ?? null}
        />
      </div>
    </main>
  )
}
