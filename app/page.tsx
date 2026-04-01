import { listSpaces, listCompanies } from '@/lib/store'
import SpaceCard from '@/components/SpaceCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const spaces = listSpaces().sort(
    (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
  )

  const spaceStats = spaces.map(space => {
    const companies = listCompanies(space.id)
    const unseenCount = companies.filter(c => !c.seenAt).length
    return { space, unseenCount, totalCount: companies.length }
  })

  const totalUnseen = spaceStats.reduce((sum, s) => sum + s.unseenCount, 0)

  return (
    <main className="min-h-screen bg-gray-950 pb-24">

      {/* Hero intro */}
      <div className="px-8 pt-16 pb-12 max-w-3xl animate-fade-up">
        <h1 className="font-display text-5xl text-white tracking-tight mb-4" style={{ letterSpacing: '-0.8px' }}>
          FTI Research
        </h1>
        <div className="w-12 h-[3px] bg-gradient-to-r from-red-500 to-red-600 rounded-full mb-6" />
        <p className="text-white/55 text-base leading-relaxed font-light">
          A VC research tool built for fast, rigorous diligence. Run AI-powered due diligence briefs and full competitive landscape analyses on any company — or use the deal flow tracker to source and monitor companies across investment spaces.
        </p>
        <p className="text-white/35 text-sm leading-relaxed mt-3 font-light">
          All research is powered by Claude with live web search, PubMed, ClinicalTrials.gov, Crunchbase, and regulatory databases. Upload a pitch deck PDF and Claude extracts context before searching.
        </p>
      </div>

      {/* Function 1 — Diligence */}
      <div className="px-8 mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/40 via-red-900/10 to-transparent overflow-hidden">
          <div className="p-8">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-red-400">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 12h4M12 16h4M8 12h.01M8 16h.01"/>
                    </svg>
                  </div>
                  <h2 className="font-display text-2xl text-white" style={{ letterSpacing: '-0.3px' }}>Diligence</h2>
                </div>

                <p className="text-white/60 text-sm leading-relaxed mb-6">
                  Instant research on any company. Type a name, add optional context, and choose your output — no tracking setup required. Results stream in real time.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  <div>
                    <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-2">DD at a Glance</p>
                    <p className="text-white/45 text-sm leading-relaxed">
                      A one-page brief for a first meeting or intro call. Covers what the company does, funding and stage, founding team, product and technology, differentiation claims (with independent corroboration where available), competitive landscape, traction, scientific foundation, and specific questions to ask in the meeting. Every claim is sourced with a direct link.
                    </p>
                  </div>
                  <div>
                    <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-2">Competitive Landscape</p>
                    <p className="text-white/45 text-sm leading-relaxed">
                      Full landscape analysis across the relevant disease area or market. Covers all competing modalities (not just direct competitors), active clinical pipelines via ClinicalTrials.gov with NCT numbers, foundational and conflicting studies via PubMed, regulatory precedents and pathways, and funding activity across the space in the last 24 months.
                    </p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/8 mb-8">
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">How to use</p>
                  <ol className="space-y-2 text-sm text-white/50 leading-relaxed">
                    <li><span className="text-white/70 font-medium">1.</span> Enter the company name.</li>
                    <li><span className="text-white/70 font-medium">2.</span> Add a description — the more context you give (technology, indication, approach, stage), the more targeted the research. Example: <span className="text-white/35 italic">"stem cell-derived beta cell replacement for Type 1 Diabetes, preclinical stage"</span>.</li>
                    <li><span className="text-white/70 font-medium">3.</span> Optionally upload a pitch deck PDF — Claude reads it before running web searches.</li>
                    <li><span className="text-white/70 font-medium">4.</span> Click DD at a Glance or Competitive Landscape. Research streams in within 30–60 seconds.</li>
                  </ol>
                </div>
              </div>
            </div>

            <Link
              href="/diligence"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 transition-colors"
            >
              Open Diligence
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Function 2 — Deal Flow */}
      <div className="px-8 mb-8 animate-fade-up" style={{ animationDelay: '0.18s' }}>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/8 border border-white/12 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-white/50">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl text-white" style={{ letterSpacing: '-0.3px' }}>Deal Flow</h2>
                {totalUnseen > 0 && (
                  <span className="text-[10px] font-semibold bg-red-500 text-white rounded-full px-2 py-0.5">
                    {totalUnseen} new
                  </span>
                )}
              </div>
            </div>

            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Track companies across investment spaces. Source new companies with AI, add companies manually, manage their status, and run full diligence directly from a company's profile.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
              <div>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Spaces</p>
                <p className="text-white/35 text-sm leading-relaxed">
                  Create an investment space with a name and thesis (e.g., "T1D Cell Therapy — companies developing cell replacement therapies for Type 1 Diabetes"). Spaces organize your deal flow by sector or theme.
                </p>
              </div>
              <div>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Sourcing</p>
                <p className="text-white/35 text-sm leading-relaxed">
                  Hit "Source now" inside any space and Claude searches Crunchbase, AngelList, TechCrunch, and trade publications to find new companies matching your thesis. New companies appear with an unseen badge. A nightly cron runs automatically and emails a digest.
                </p>
              </div>
              <div>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Company Profiles</p>
                <p className="text-white/35 text-sm leading-relaxed">
                  Each company has a full profile page with status tracking (Sourced → Reviewing → Tracking → Passed), a description field, pitch deck upload, and the full Diligence panel — DD at a Glance and Competitive Landscape — directly embedded.
                </p>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/8 mb-8">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">How to use</p>
              <ol className="space-y-2 text-sm text-white/50 leading-relaxed">
                <li><span className="text-white/70 font-medium">1.</span> Create a space with a name and investment thesis.</li>
                <li><span className="text-white/70 font-medium">2.</span> Click "Source now" to have Claude find companies, or add companies manually.</li>
                <li><span className="text-white/70 font-medium">3.</span> Click any company to open its profile. Update status, add a description, upload a deck.</li>
                <li><span className="text-white/70 font-medium">4.</span> Run DD at a Glance or Competitive Landscape from the company profile.</li>
              </ol>
            </div>

            <Link
              href="/spaces/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-white/5 text-white/60 border border-white/15 hover:bg-white/10 hover:text-white/80 transition-colors"
            >
              + New Space
            </Link>
          </div>
        </div>
      </div>

      {/* Spaces grid */}
      {spaces.length > 0 && (
        <div className="px-8 animate-fade-up" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center justify-between mb-5">
            <p className="text-white/25 text-xs uppercase tracking-widest font-medium">Your Spaces</p>
            <Link
              href="/spaces/new"
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              + New Space
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaceStats.map(({ space, unseenCount, totalCount }, i) => (
              <SpaceCard
                key={space.id}
                space={space}
                unseenCount={unseenCount}
                totalCount={totalCount}
                index={i}
              />
            ))}
          </div>
        </div>
      )}

    </main>
  )
}
