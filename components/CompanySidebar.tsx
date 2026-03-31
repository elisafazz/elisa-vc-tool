'use client'

import type { Company, CompanyStatus } from '@/lib/types'
import StatusBadge from './StatusBadge'
import AlertBadge from './AlertBadge'

const STATUS_BORDER: Record<CompanyStatus, string> = {
  Sourced:   'border-l-amber-400',
  Reviewing: 'border-l-blue-400',
  Tracking:  'border-l-green-400',
  Passed:    'border-l-gray-600',
}

const STATUS_ORDER: CompanyStatus[] = ['Sourced', 'Reviewing', 'Tracking', 'Passed']

interface Props {
  companies: Company[]
  selectedId: string | null
  onSelect: (company: Company) => void
  filterStatus: CompanyStatus | 'All'
  onFilterChange: (status: CompanyStatus | 'All') => void
}

export default function CompanySidebar({ companies, selectedId, onSelect, filterStatus, onFilterChange }: Props) {
  const filtered = filterStatus === 'All' ? companies : companies.filter(c => c.status === filterStatus)
  const unseenCount = companies.filter(c => !c.seenAt).length

  return (
    <aside className="w-72 flex-shrink-0 bg-gray-900/95 backdrop-blur-xl border-r border-white/10 flex flex-col overflow-hidden">
      {/* Filter bar */}
      <div className="px-3 py-2 border-b border-white/10 flex gap-1 flex-wrap">
        {(['All', ...STATUS_ORDER] as const).map(s => (
          <button
            key={s}
            onClick={() => onFilterChange(s)}
            className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
              filterStatus === s
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                : 'text-white/40 border border-white/10 hover:text-white/60 hover:border-white/20'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
        <p className="text-xs text-white/40 font-medium uppercase tracking-wide">
          {filtered.length} {filtered.length === 1 ? 'company' : 'companies'}
        </p>
        {unseenCount > 0 && (
          <div className="flex items-center gap-1.5">
            <AlertBadge count={unseenCount} />
            <span className="text-xs text-white/30">new</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map(company => {
          const isSelected = company.id === selectedId
          const isNew = !company.seenAt
          const borderClass = STATUS_BORDER[company.status] ?? 'border-l-gray-600'

          return (
            <button
              key={company.id}
              onClick={() => onSelect(company)}
              className={`w-full text-left px-4 py-3 border-b border-white/5 border-l-2 transition-colors flex items-start gap-3 ${
                isSelected
                  ? 'bg-white/10 border-l-amber-400'
                  : `${borderClass} hover:bg-white/5`
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-white/80'}`}>
                    {company.name}
                  </span>
                  {isNew && (
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {company.stage && (
                    <span className="text-xs text-white/40 truncate">{company.stage}</span>
                  )}
                  {company.source === 'sourced' && (
                    <span className="text-xs text-white/25">AI</span>
                  )}
                </div>
                {company.oneLiner && (
                  <p className="text-xs text-white/30 mt-1 truncate">{company.oneLiner}</p>
                )}
              </div>
            </button>
          )
        })}

        {filtered.length === 0 && (
          <p className="text-white/25 text-xs px-4 py-6">No companies yet.</p>
        )}
      </div>
    </aside>
  )
}
