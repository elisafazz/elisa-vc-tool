'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Space, Company, CompanyStatus } from '@/lib/types'
import CompanySidebar from '@/components/CompanySidebar'
import StatusBadge from '@/components/StatusBadge'

interface Props {
  space: Space
  initialCompanies: Company[]
}

export default function SpaceView({ space, initialCompanies }: Props) {
  const router = useRouter()
  const [companies, setCompanies] = useState(initialCompanies)
  const [selected, setSelected] = useState<Company | null>(null)
  const [filterStatus, setFilterStatus] = useState<CompanyStatus | 'All'>('All')
  const [sourcing, setSourcing] = useState(false)
  const [sourceMsg, setSourceMsg] = useState<string | null>(null)
  const [addingCompany, setAddingCompany] = useState(false)
  const [newName, setNewName] = useState('')
  const [newWebsite, setNewWebsite] = useState('')
  const [newStage, setNewStage] = useState('')
  const [alertsEnabled, setAlertsEnabled] = useState(space.alertsEnabled ?? false)
  const [alertEmail, setAlertEmail] = useState(space.alertEmail ?? '')
  const [showAlertConfig, setShowAlertConfig] = useState(false)
  const [savingAlert, setSavingAlert] = useState(false)
  const [alertSaveMsg, setAlertSaveMsg] = useState<string | null>(null)

  async function handleSelect(company: Company) {
    setSelected(company)
    // Mark as seen
    if (!company.seenAt) {
      await fetch('/api/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: company.id, seenAt: new Date().toISOString() }),
      })
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, seenAt: new Date().toISOString() } : c))
    }
  }

  async function handleSource() {
    setSourcing(true)
    setSourceMsg(null)
    try {
      const res = await fetch('/api/source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId: space.id }),
      })
      const data = await res.json()
      if (data.added > 0) {
        setSourceMsg(`${data.added} new ${data.added === 1 ? 'company' : 'companies'} found`)
        setCompanies(prev => [...data.companies, ...prev])
      } else {
        setSourceMsg('No new companies found')
      }
    } catch {
      setSourceMsg('Sourcing failed')
    } finally {
      setSourcing(false)
    }
  }

  async function saveAlertSettings(enabled: boolean, email: string) {
    setSavingAlert(true)
    setAlertSaveMsg(null)
    try {
      const res = await fetch('/api/spaces', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: space.id, alertsEnabled: enabled, alertEmail: email || null }),
      })
      if (res.ok) {
        setAlertsEnabled(enabled)
        setAlertEmail(email)
        setAlertSaveMsg(enabled ? 'Saved' : 'Disabled')
        setTimeout(() => setAlertSaveMsg(null), 3000)
      } else {
        const j = await res.json().catch(() => ({}))
        setAlertSaveMsg(`Error: ${j.error ?? res.status}`)
      }
    } catch {
      setAlertSaveMsg('Save failed - check connection')
    } finally {
      setSavingAlert(false)
    }
  }

  async function handleAddCompany(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          spaceId: space.id,
          website: newWebsite || null,
          stage: newStage || null,
          source: 'manual',
        }),
      })
      const company: Company = await res.json()
      setCompanies(prev => [company, ...prev])
      setNewName('')
      setNewWebsite('')
      setNewStage('')
      setAddingCompany(false)
    } catch {}
  }

  return (
    <main className="h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-8 pb-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-white/40 hover:text-white/60 transition-colors text-sm">
            Deal Flow
          </Link>
          <span className="text-white/20">/</span>
          <h1 className="font-display text-xl text-white" style={{ letterSpacing: '-0.2px' }}>
            {space.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {sourceMsg && (
            <span className="text-xs text-white/40">{sourceMsg}</span>
          )}
          {/* Alert indicator + toggle */}
          <button
            onClick={() => setShowAlertConfig(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              alertsEnabled
                ? 'bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/25'
                : 'text-white/35 border-white/10 hover:text-white/60 hover:border-white/20'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            {alertsEnabled ? 'Alerts on' : 'Alerts off'}
          </button>
          <button
            onClick={() => setAddingCompany(v => !v)}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-white/50 border border-white/10 hover:text-white/70 hover:border-white/20 transition-colors"
          >
            + Add manually
          </button>
          <button
            onClick={handleSource}
            disabled={sourcing}
            className="px-4 py-1.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 disabled:opacity-50 transition-colors"
          >
            {sourcing ? 'Sourcing...' : 'Source now'}
          </button>
        </div>
      </div>

      {/* Alert config panel */}
      {showAlertConfig && (
        <div className="flex-shrink-0 mx-6 mt-3 mb-1 rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Weekly Email Alerts</p>
          <p className="text-white/35 text-xs leading-relaxed">
            Every Monday at 8am UTC - new companies, FDA approvals/rejections, funding rounds, partnerships, and company announcements in the <span className="text-white/55">{space.name}</span> space.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="email"
              value={alertEmail}
              onChange={e => setAlertEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-500/40 transition-colors"
            />
            <button
              onClick={() => saveAlertSettings(true, alertEmail)}
              disabled={savingAlert || !alertEmail.trim()}
              className="px-4 py-2 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 disabled:opacity-40 transition-colors"
            >
              {savingAlert ? 'Saving...' : alertsEnabled ? 'Update' : 'Enable'}
            </button>
            {alertsEnabled && (
              <button
                onClick={() => { saveAlertSettings(false, ''); setShowAlertConfig(false) }}
                disabled={savingAlert}
                className="px-4 py-2 rounded-full text-xs font-medium text-white/35 border border-white/8 hover:text-red-400 hover:border-red-500/20 disabled:opacity-40 transition-colors"
              >
                Disable
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            {alertSaveMsg && (
              <p className={`text-xs ${alertSaveMsg.startsWith('Error') || alertSaveMsg.startsWith('Save failed') ? 'text-red-400' : 'text-green-400'}`}>
                {alertSaveMsg}
              </p>
            )}
            {space.lastAlertAt && (
              <p className="text-white/20 text-xs">Last sent {new Date(space.lastAlertAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            )}
          </div>
        </div>
      )}

      {/* Add company form */}
      {addingCompany && (
        <form onSubmit={handleAddCompany} className="flex-shrink-0 px-6 py-3 bg-white/3 border-b border-white/10 flex gap-3 items-center">
          <input
            autoFocus
            type="text"
            placeholder="Company name *"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-500/30 w-48"
          />
          <input
            type="text"
            placeholder="Website"
            value={newWebsite}
            onChange={e => setNewWebsite(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-500/30 w-44"
          />
          <input
            type="text"
            placeholder="Stage"
            value={newStage}
            onChange={e => setNewStage(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-500/30 w-32"
          />
          <button type="submit" className="px-4 py-1.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 transition-colors">
            Add
          </button>
          <button type="button" onClick={() => setAddingCompany(false)} className="text-white/30 text-xs hover:text-white/50 transition-colors">
            Cancel
          </button>
        </form>
      )}

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        <CompanySidebar
          companies={companies}
          selectedId={selected?.id ?? null}
          onSelect={handleSelect}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
        />

        {/* Main panel */}
        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="font-display text-2xl text-white" style={{ letterSpacing: '-0.2px' }}>
                      {selected.name}
                    </h2>
                    <StatusBadge status={selected.status} />
                  </div>
                  {selected.stage && <p className="text-white/40 text-sm">{selected.stage}</p>}
                  {selected.oneLiner && <p className="text-white/50 text-sm mt-2">{selected.oneLiner}</p>}
                  {selected.website && (
                    <a
                      href={selected.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-500/70 text-xs hover:text-red-500 transition-colors mt-2 block"
                    >
                      {selected.website}
                    </a>
                  )}
                </div>
                <Link
                  href={`/companies/${selected.id}`}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 transition-colors"
                >
                  Full Research
                </Link>
              </div>

              {/* Status update */}
              <div className="flex gap-2 mb-8">
                {(['Sourced', 'Reviewing', 'Tracking', 'Passed'] as CompanyStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={async () => {
                      await fetch('/api/companies', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: selected.id, status: s }),
                      })
                      const updated = { ...selected, status: s }
                      setSelected(updated)
                      setCompanies(prev => prev.map(c => c.id === selected.id ? updated : c))
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                      selected.status === s
                        ? 'bg-white/10 text-white border-white/20'
                        : 'text-white/30 border-white/10 hover:text-white/50 hover:border-white/20'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <p className="text-white/25 text-sm">
                Click "Full Research" to run DD at a Glance or Competitive Landscape for this company.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/20 text-sm">Select a company to view details</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
