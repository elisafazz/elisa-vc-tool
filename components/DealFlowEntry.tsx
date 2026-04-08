'use client'

import { useState } from 'react'
import type { DealFlowEntry } from '@/lib/types'

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <button
      onClick={copy}
      className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors border
        border-white/10 text-white/30 hover:text-white/70 hover:border-white/25 bg-transparent"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return (
      <div className="flex items-start gap-4 py-3 border-b border-white/5 last:border-0">
        <span className="w-48 flex-shrink-0 text-xs font-medium text-white/30 uppercase tracking-wide pt-0.5">
          {label}
        </span>
        <span className="flex-1 text-sm text-white/20 italic">blank</span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-4 py-3 border-b border-white/5 last:border-0">
      <span className="w-48 flex-shrink-0 text-xs font-medium text-white/40 uppercase tracking-wide pt-0.5">
        {label}
      </span>
      <span className="flex-1 text-sm text-white/80 leading-relaxed break-words">{value}</span>
      <CopyButton value={value} />
    </div>
  )
}

function buildCopyAll(entry: DealFlowEntry): string {
  const lines = [
    `Company Name: ${entry.companyName}`,
    `First Contacted: ${entry.firstContacted}`,
    `Overview: ${entry.overview}`,
    `Tag: ${entry.tag ?? ''}`,
    `Country: ${entry.country ?? ''}`,
    `Job Title/Name: ${entry.jobTitleName ?? ''}`,
    `Bio: Classification: ${entry.bioClassification ?? ''}`,
    `Bio: Disease Area: ${entry.bioDiseaseArea ?? ''}`,
    `Bio (Tx&Drug): Modality: ${entry.bioModality ?? ''}`,
    `Next Series: ${entry.nextSeries ?? ''}`,
    `Stage: ${entry.stage ?? ''}`,
    `Person in Charge: ${entry.personInCharge}`,
    `Status: ${entry.status}`,
    `Web Site (URL): ${entry.websiteUrl ?? ''}`,
    `Contact Background: ${entry.contactBackground}`,
  ]
  return lines.join('\n')
}

export default function DealFlowEntryView({ entry }: { entry: DealFlowEntry }) {
  const [copied, setCopied] = useState(false)

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(buildCopyAll(entry))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 bg-white/[0.02]">
        <div>
          <h3 className="font-display text-xl text-white" style={{ letterSpacing: '-0.2px' }}>
            {entry.companyName}
          </h3>
          <p className="text-white/30 text-xs mt-0.5">Generated entry — ready to paste into Notion</p>
        </div>
        <button
          onClick={copyAll}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors
            border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          {copied ? 'Copied all' : 'Copy all'}
        </button>
      </div>

      {/* Fields */}
      <div className="px-6 py-2">
        <Row label="Company Name" value={entry.companyName} />
        <Row label="First Contacted" value={entry.firstContacted} />
        <Row label="Overview" value={entry.overview} />
        <Row label="Tag" value={entry.tag} />
        <Row label="Country" value={entry.country} />
        <Row label="Job Title / Name" value={entry.jobTitleName} />
        <Row label="Bio: Classification" value={entry.bioClassification} />
        <Row label="Bio: Disease Area" value={entry.bioDiseaseArea} />
        <Row label="Bio (Tx&Drug): Modality" value={entry.bioModality} />
        <Row label="Next Series" value={entry.nextSeries} />
        <Row label="Stage" value={entry.stage} />
        <Row label="Person in Charge" value={entry.personInCharge} />
        <Row label="Status" value={entry.status} />
        <Row label="Web Site (URL)" value={entry.websiteUrl} />
        <Row label="Contact Background" value={entry.contactBackground} />
      </div>
    </div>
  )
}
