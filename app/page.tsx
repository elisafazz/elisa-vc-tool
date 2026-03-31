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
      <div className="flex-shrink-0 px-8 pt-12 pb-8 animate-fade-up flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl text-white tracking-tight" style={{ letterSpacing: '-0.5px' }}>
            Deal Flow
          </h1>
          <div className="w-10 h-[2.5px] bg-gradient-to-r from-amber-400 to-amber-500 rounded-full mt-3" />
          <p className="text-white/30 mt-3 text-sm font-light tracking-wide">
            {spaces.length} {spaces.length === 1 ? 'space' : 'spaces'} tracked
          </p>
        </div>
        <Link
          href="/spaces/new"
          className="px-4 py-2 rounded-full text-sm font-medium bg-amber-400/15 text-amber-300 border border-amber-400/25 hover:bg-amber-400/25 transition-colors"
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
            <div className="col-span-full flex flex-col items-center justify-center py-24 gap-4">
              <p className="text-white/25 text-sm">No spaces yet.</p>
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
