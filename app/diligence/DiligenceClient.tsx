'use client'

import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type ResearchType = 'dd' | 'competitive'

export type PreviousCompany = {
  id: string
  name: string
  description: string | null
  addedAt: string
  hasDd: boolean
  hasCompetitive: boolean
}

// Simple markdown renderer - converts Claude's markdown output to HTML
function renderMarkdown(text: string): string {
  return text
    // Headers
    .replace(/^#### (.+)$/gm, '<h4 class="text-white/80 font-semibold text-sm mt-5 mb-1">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="text-white/85 font-semibold text-base mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-white font-semibold text-lg mt-7 mb-2 pb-1 border-b border-white/10">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-white font-semibold text-xl mt-8 mb-3">$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white/90">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-white/70">$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors">$1</a>')
    // Bullet lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-white/70 leading-relaxed list-disc list-outside pl-1">$1</li>')
    .replace(/^  - (.+)$/gm, '<li class="ml-8 text-white/55 leading-relaxed list-disc list-outside pl-1 text-sm">$1</li>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 text-white/70 leading-relaxed list-decimal list-outside pl-1">$1</li>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-white/8 text-red-300 rounded px-1.5 py-0.5 text-xs font-mono">$1</code>')
    // Italic markers used in prompts like *(Claimed)*
    .replace(/\*\(([^)]+)\)\*/g, '<span class="text-white/40 text-xs italic">($1)</span>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="border-white/10 my-4" />')
    // Paragraphs - wrap lines that aren't already wrapped
    .replace(/\n{2,}/g, '\n\n')
}

const EXTRACT_PROMPT = `Please extract all text from this pitch deck PDF and output it as plain text. For any charts, graphs, or tables, describe their content in full detail. Output only the extracted content with no preamble or commentary. Output as a downloadable .txt file.`

function DeckUploadSection({
  pdfFile,
  fileInputRef,
  onFileChange,
  onRemove,
}: {
  pdfFile: File | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
}) {
  const [copied, setCopied] = useState(false)

  function copyPrompt() {
    navigator.clipboard.writeText(EXTRACT_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      {/* Step-by-step instruction */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 space-y-3">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Pitch Deck Context</p>
        <p className="text-white/55 text-sm leading-relaxed">
          This tool requires you to extract the text from your pitch deck before uploading.
          Go to <span className="text-white/80">claude.ai</span>, start a new conversation, upload your PDF, and enter this prompt:
        </p>
        <div className="flex items-start gap-3 rounded-lg bg-white/5 border border-white/10 px-4 py-3">
          <p className="flex-1 text-white/60 text-xs leading-relaxed font-mono">{EXTRACT_PROMPT}</p>
          <button
            onClick={copyPrompt}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors mt-0.5 font-medium"
            style={copied ? { borderColor: 'rgba(239,68,68,0.4)', color: 'rgb(248,113,113)', background: 'rgba(239,68,68,0.08)' } : { borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.45)' }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="text-white/35 text-xs">Save Claude&apos;s response as a <span className="text-white/55">.txt file</span>, then upload it below.</p>
      </div>

      {/* Upload zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex items-center gap-4 rounded-xl border-2 border-dashed px-5 py-4 cursor-pointer transition-all group ${
          pdfFile ? 'border-red-500/40 bg-red-500/8' : 'border-white/15 bg-white/[0.02] hover:border-red-500/30 hover:bg-red-500/5'
        }`}
      >
        <input ref={fileInputRef} type="file" accept=".txt,text/plain" className="hidden" onChange={onFileChange} />
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
          pdfFile ? 'bg-red-500/20 border border-red-500/30' : 'bg-white/5 border border-white/10 group-hover:bg-red-500/10 group-hover:border-red-500/20'
        }`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            className={pdfFile ? 'text-red-400' : 'text-white/35 group-hover:text-red-400 transition-colors'}>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          {pdfFile ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-red-400 text-sm font-medium truncate">{pdfFile.name}</p>
                <p className="text-white/35 text-xs mt-0.5">{(pdfFile.size / 1024 / 1024).toFixed(1)} MB - will be read before web searching</p>
              </div>
              <button onClick={e => { e.stopPropagation(); onRemove() }} className="text-white/30 hover:text-white/60 transition-colors text-xs">Remove</button>
            </div>
          ) : (
            <div>
              <p className="text-white/50 text-sm font-medium group-hover:text-white/70 transition-colors">Upload extracted text (.txt)</p>
              <p className="text-white/25 text-xs mt-0.5">Click to select your .txt file</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PreviousCompaniesGrid({
  companies,
  onSelect,
}: {
  companies: PreviousCompany[]
  onSelect: (name: string) => void
}) {
  if (companies.length === 0) return null

  return (
    <div className="px-8 pb-10 animate-fade-up" style={{ animationDelay: '0.05s' }}>
      <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Previously researched</p>
      <div className="grid grid-cols-2 gap-3 max-w-3xl sm:grid-cols-3">
        {companies.map(c => (
          <button
            key={c.id}
            onClick={() => onSelect(c.name)}
            className="text-left rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/5 hover:border-white/15 px-4 py-3.5 transition-all group"
          >
            <p className="text-white/80 text-sm font-medium group-hover:text-white transition-colors truncate">{c.name}</p>
            {c.description && (
              <p className="text-white/30 text-xs mt-1 leading-relaxed line-clamp-2">{c.description}</p>
            )}
            <div className="flex gap-2 mt-2.5">
              {c.hasDd && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium">DD</span>
              )}
              {c.hasCompetitive && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10 font-medium">Competitive</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function DiligenceClient({ previousCompanies }: { previousCompanies: PreviousCompany[] }) {
  return <Suspense><DiligenceInner previousCompanies={previousCompanies} /></Suspense>
}

function DiligenceInner({ previousCompanies }: { previousCompanies: PreviousCompany[] }) {
  const searchParams = useSearchParams()
  const [companyName, setCompanyName] = useState(searchParams.get('name') ?? '')
  const [description, setDescription] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [results, setResults] = useState<{ dd: string; competitive: string }>({ dd: '', competitive: '' })
  const [activeTab, setActiveTab] = useState<ResearchType>('dd')
  const [streaming, setStreaming] = useState(false)
  const [streamingType, setStreamingType] = useState<ResearchType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [looked, setLooked] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-lookup when arriving with ?name= param
  useEffect(() => {
    const name = searchParams.get('name')
    if (name) lookup(name)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const TXT_SIZE_LIMIT = 1 * 1024 * 1024  // 1 MB

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const isTxt = file.type === 'text/plain' || file.name.endsWith('.txt')
    if (!isTxt) { setError('Only .txt files are accepted. See instructions below.'); return }
    if (file.size > TXT_SIZE_LIMIT) {
      setError(`Text file is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 1 MB.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setPdfFile(file)
    setError(null)
  }

  function removePdf() {
    setPdfFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Look up saved results for a company name
  const lookup = useCallback(async (name: string) => {
    if (!name.trim()) return
    setLooked(false)
    setCompanyName(name)
    const res = await fetch(`/api/research/lookup?name=${encodeURIComponent(name.trim())}`)
    const data = await res.json()
    setLooked(true)
    if (data) {
      setCompanyId(data.company.id)
      setResults({ dd: data.dd ?? '', competitive: data.competitive ?? '' })
      if (data.dd) setActiveTab('dd')
      if (data.company.description && !description) setDescription(data.company.description)
    } else {
      setCompanyId(null)
      setResults({ dd: '', competitive: '' })
    }
  }, [description])

  function handleSelectPrevious(name: string) {
    lookup(name)
    // Scroll to results
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100)
  }

  async function run(type: ResearchType) {
    if (!companyName.trim()) return

    // Don't rerun if already have results for this type
    if (results[type] && !window.confirm(`${type === 'dd' ? 'DD at a Glance' : 'Competitive Landscape'} has already been run for ${companyName}. Run again?`)) return

    setError(null)
    setStreaming(true)
    setStreamingType(type)
    setActiveTab(type)
    setResults(prev => ({ ...prev, [type]: '' }))

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    try {
      const form = new FormData()
      form.append('companyName', companyName.trim())
      form.append('type', type)
      if (description.trim()) form.append('description', description.trim())
      if (companyId) form.append('companyId', companyId)
      if (pdfFile) form.append('pdf', pdfFile)

      const res = await fetch('/api/research/run', {
        method: 'POST',
        body: form,
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) {
        let msg = `Research request failed (${res.status})`
        if (res.status === 413) msg = 'File too large for upload. Max 1 MB for .txt.'
        else if (res.status === 504) msg = 'Request timed out.'
        else { try { const j = await res.clone().json(); if (j.error) msg = j.error } catch {} }
        setError(msg)
        setStreaming(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.companyId && !companyId) setCompanyId(parsed.companyId)
            if (parsed.text) {
              accumulated += parsed.text
              setResults(prev => ({ ...prev, [type]: accumulated }))
            }
          } catch {}
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') setError('Stream interrupted')
    } finally {
      setStreaming(false)
      setStreamingType(null)
    }
  }

  function download(type: ResearchType) {
    const content = results[type]
    if (!content) return
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${companyName.replace(/\s+/g, '-')}-${type === 'dd' ? 'dd' : 'competitive'}-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const currentResult = results[activeTab]
  const isStreamingThis = streaming && streamingType === activeTab

  return (
    <main className="min-h-screen bg-gray-950 pb-24">
      {/* Header */}
      <div className="px-8 pt-12 pb-8 animate-fade-up">
        <Link href="/" className="text-white/30 text-xs hover:text-white/60 transition-colors mb-5 block">← Back</Link>
        <h1 className="font-display text-4xl text-white tracking-tight" style={{ letterSpacing: '-0.5px' }}>Diligence</h1>
        <div className="w-10 h-[2.5px] bg-gradient-to-r from-red-500 to-red-600 rounded-full mt-3" />
        <p className="text-white/35 mt-3 text-sm font-light">Run DD or competitive landscape on any company</p>
      </div>

      {/* Previously researched companies */}
      <PreviousCompaniesGrid companies={previousCompanies} onSelect={handleSelectPrevious} />

      {/* Input panel */}
      <div className="px-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="max-w-3xl space-y-4">

          <input
            type="text"
            value={companyName}
            onChange={e => { setCompanyName(e.target.value); setLooked(false) }}
            onBlur={e => lookup(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && companyName.trim()) { lookup(companyName); } }}
            placeholder="Company name"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-base focus:outline-none focus:border-red-500/40"
          />

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What do they do? Technology, indication, approach, stage. Example: stem cell-derived beta cell replacement for Type 1 Diabetes, preclinical."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder-white/25 text-sm resize-none focus:outline-none focus:border-red-500/40"
          />

          {/* Pitch deck instructions + upload */}
          <DeckUploadSection pdfFile={pdfFile} fileInputRef={fileInputRef} onFileChange={handleFileChange} onRemove={removePdf} />

          {/* Saved results notice */}
          {looked && companyId && (results.dd || results.competitive) && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <p className="text-white/60 text-xs">
                Saved results found for <span className="text-white/80">{companyName}</span> -
                {results.dd && ' DD'}{results.dd && results.competitive && ' +'}{results.competitive && ' Competitive'} loaded below. Click Re-run to refresh.
              </p>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Run buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => run('dd')}
              disabled={streaming || !companyName.trim()}
              className="px-5 py-2.5 rounded-full text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {streaming && streamingType === 'dd' ? 'Running...' : results.dd ? 'Re-run DD' : 'DD at a Glance'}
            </button>
            <button
              onClick={() => run('competitive')}
              disabled={streaming || !companyName.trim()}
              className="px-5 py-2.5 rounded-full text-sm font-medium bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {streaming && streamingType === 'competitive' ? 'Running...' : results.competitive ? 'Re-run Competitive' : 'Competitive Landscape'}
            </button>
            {streaming && (
              <button onClick={() => abortRef.current?.abort()} className="px-5 py-2.5 rounded-full text-sm font-medium bg-white/5 text-white/35 border border-white/8 hover:text-white/60 transition-colors">
                Stop
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results tabs + output */}
      {(results.dd || results.competitive || streaming) && (
        <div className="px-8 mt-10 max-w-4xl">
          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 border-b border-white/10">
            {(['dd', 'competitive'] as ResearchType[]).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors mr-2 ${
                  activeTab === t ? 'border-red-500 text-white' : 'border-transparent text-white/35 hover:text-white/60'
                }`}
              >
                {t === 'dd' ? 'DD at a Glance' : 'Competitive Landscape'}
                {results[t] && !isStreamingThis && (
                  <span className="ml-2 w-1.5 h-1.5 rounded-full bg-red-500 inline-block align-middle" />
                )}
              </button>
            ))}
            {/* Download button */}
            {currentResult && !isStreamingThis && (
              <button
                onClick={() => download(activeTab)}
                className="ml-auto mb-1 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-white/45 border border-white/10 hover:bg-white/10 hover:text-white/70 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download .md
              </button>
            )}
          </div>

          {/* Content */}
          {currentResult ? (
            <div
              className="text-sm leading-relaxed text-white/70 space-y-0.5"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(currentResult) + (isStreamingThis ? '<span class="cursor-blink text-red-500 ml-0.5 font-bold">|</span>' : '') }}
            />
          ) : isStreamingThis ? (
            <p className="text-white/30 text-sm"><span className="cursor-blink text-red-500">|</span></p>
          ) : (
            <p className="text-white/20 text-sm">No results yet for this tab.</p>
          )}
        </div>
      )}

      {!results.dd && !results.competitive && !streaming && (
        <div className="flex items-center justify-center py-24 px-8">
          <p className="text-white/15 text-sm">Enter a company name and run research above.</p>
        </div>
      )}
    </main>
  )
}
