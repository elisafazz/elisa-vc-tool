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

  return (
    <main className="h-screen flex flex-col bg-gray-950">
      <div className="flex-shrink-0 px-8 pt-12 pb-8 animate-fade-up">
        <h1 className="font-display text-4xl text-white tracking-tight" style={{ letterSpacing: '-0.5px' }}>
          FTI
        </h1>
        <div className="w-10 h-[2.5px] bg-gradient-to-r from-amber-400 to-amber-500 rounded-full mt-3" />
        <p className="text-white/30 mt-3 text-sm font-light tracking-wide">VC Research Tool</p>
      </div>

      {/* Two main function cards */}
      <div className="flex-shrink-0 px-8 pb-10 grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fade-up" style={{ animationDelay: '0.08s' }}>
        {/* Diligence */}
        <Link
          href="/diligence"
          className="group relative overflow-hidden rounded-2xl p-7 flex flex-col justify-between min-h-[180px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] bg-gradient-to-br from-amber-950/60 via-amber-900/30 to-transparent border border-amber-400/15 hover:border-amber-400/30"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/20 flex items-center justify-center mb-5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-amber-400">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 12h4M12 16h4M8 12h.01M8 16h.01"/>
              </svg>
            </div>
            <h2 className="font-display text-2xl text-white mb-2" style={{ letterSpacing: '-0.2px' }}>Diligence</h2>
            <p className="text-white/45 text-sm font-light leading-relaxed">
              Run DD or competitive landscape on any company. No setup required.
            </p>
          </div>
          <div className="relative z-10 flex items-center justify-between mt-6">
            <span className="text-amber-400/60 text-xs font-medium group-hover:text-amber-400 transition-colors">Open</span>
            <div className="w-7 h-7 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center group-hover:bg-amber-400/20 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400 group-hover:translate-x-px transition-transform">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </Link>

        {/* Deal Flow */}
        <Link
          href="#deal-flow"
          onClick={e => { e.preventDefault(); document.getElementById('deal-flow')?.scrollIntoView({ behavior: 'smooth' }) }}
          className="group relative overflow-hidden rounded-2xl p-7 flex flex-col justify-between min-h-[180px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] bg-gradient-to-br from-slate-900/80 via-slate-800/30 to-transparent border border-white/10 hover:border-white/20"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="w-9 h-9 rounded-xl bg-white/8 border border-white/12 flex items-center justify-center mb-5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-white/60">
                <path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18" />
              </svg>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="font-display text-2xl text-white" style={{ letterSpacing: '-0.2px' }}>Deal Flow</h2>
              {spaceStats.some(s => s.unseenCount > 0) && (
                <span className="text-[10px] font-semibold bg-amber-400 text-black rounded-full px-2 py-0.5">
                  {spaceStats.reduce((sum, s) => sum + s.unseenCount, 0)} new
                </span>
              )}
            </div>
            <p className="text-white/45 text-sm font-light leading-relaxed">
              Track sourced companies across investment spaces. Get alerts on new deals.
            </p>
          </div>
          <div className="relative z-10 flex items-center justify-between mt-6">
            <span className="text-white/30 text-xs font-medium group-hover:text-white/60 transition-colors">
              {spaces.length} {spaces.length === 1 ? 'space' : 'spaces'} tracked
            </span>
            <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40 group-hover:translate-y-px transition-transform">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Deal Flow section */}
      <div id="deal-flow" className="flex-shrink-0 px-8 pb-4 flex items-center justify-between">
        <p className="text-white/20 text-xs uppercase tracking-widest font-medium">Spaces</p>
        <Link
          href="/spaces/new"
          className="px-4 py-1.5 rounded-full text-xs font-medium bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70 transition-colors"
        >
          + New Space
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-8 pb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaceStats.map(({ space, unseenCount, totalCount }, i) => (
            <SpaceCard
              key={space.id}
              space={space}
              unseenCount={unseenCount}
              totalCount={totalCount}
              index={i}
            />
          ))}
          {spaces.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 gap-4">
              <p className="text-white/20 text-sm">No spaces yet.</p>
              <Link
                href="/spaces/new"
                className="px-5 py-2 rounded-full text-sm font-medium bg-amber-400/15 text-amber-300 border border-amber-400/25 hover:bg-amber-400/25 transition-colors"
              >
                Create your first space
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
