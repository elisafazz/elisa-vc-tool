import Link from 'next/link'
import type { Space } from '@/lib/types'
import AlertBadge from './AlertBadge'

const GRADIENTS = [
  'from-blue-900 via-blue-700 to-cyan-500',
  'from-violet-900 via-purple-700 to-pink-500',
  'from-emerald-900 via-teal-700 to-green-400',
  'from-orange-900 via-rose-700 to-orange-400',
  'from-slate-900 via-indigo-800 to-blue-500',
  'from-amber-900 via-orange-700 to-yellow-400',
]

interface Props {
  space: Space
  unseenCount: number
  totalCount: number
  index: number
}

export default function SpaceCard({ space, unseenCount, totalCount, index }: Props) {
  const gradient = GRADIENTS[index % GRADIENTS.length]
  const lastSourced = space.lastSourcedAt
    ? new Date(space.lastSourcedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <Link
      href={`/spaces/${space.id}`}
      className="group relative overflow-hidden rounded-2xl aspect-[3/2] flex flex-col justify-between transition-all duration-400 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.08)] animate-fade-up"
      style={{ animationDelay: `${0.1 + index * 0.08}s` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

      <div className="flex justify-between items-start p-5 relative z-10">
        <div className="flex items-center gap-2">
          {unseenCount > 0 && <AlertBadge count={unseenCount} />}
        </div>
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full backdrop-blur-md bg-white/10 text-white/60 border border-white/15">
          {totalCount} {totalCount === 1 ? 'company' : 'companies'}
        </span>
      </div>

      <div className="relative z-10 p-5 pt-0">
        {space.description && (
          <p className="text-white/50 text-xs font-normal uppercase tracking-[0.08em] mb-1.5 truncate">{space.description}</p>
        )}
        <h2 className="font-display text-white text-2xl leading-tight" style={{ letterSpacing: '-0.2px' }}>{space.name}</h2>
        {lastSourced && (
          <p className="text-white/35 text-xs mt-2 font-light">Last sourced {lastSourced}</p>
        )}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-white/30 text-xs font-medium group-hover:text-white/60 transition-colors">Open space</span>
          <div className="w-7 h-7 rounded-full bg-white/5 border border-white/8 flex items-center justify-center group-hover:bg-red-500/15 group-hover:border-red-500/25 transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40 group-hover:text-red-500 group-hover:translate-x-px transition-all">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}
