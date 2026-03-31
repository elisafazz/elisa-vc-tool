import type { CompanyStatus } from '@/lib/types'

const BADGE: Record<CompanyStatus, string> = {
  Sourced:   'bg-amber-400/15 text-amber-200 border border-amber-400/20',
  Reviewing: 'bg-blue-400/20 text-blue-100 border border-blue-300/20',
  Tracking:  'bg-green-400/20 text-green-100 border border-green-300/20',
  Passed:    'bg-white/10 text-white/50 border border-white/15',
}

export default function StatusBadge({ status }: { status: CompanyStatus }) {
  return (
    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full backdrop-blur-md ${BADGE[status] ?? BADGE.Sourced}`}>
      {status}
    </span>
  )
}
