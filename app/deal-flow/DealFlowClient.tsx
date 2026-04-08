'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import DealFlowEntryView from '@/components/DealFlowEntry'
import type { DealFlowEntry } from '@/lib/types'

const EXTRACT_PROMPT = `Please extract all text from this pitch deck PDF and output it as plain text. For any charts, graphs, or tables, describe their content in full detail. Output only the extracted content with no preamble or commentary. Output as a downloadable .txt file.`

function ExtractionInstructions({ onText }: { onText: (text: string) => void }) {
  const [copied, setCopied] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function copyPrompt() {
    navigator.clipboard.writeText(EXTRACT_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function readFile(file: File) {
    setFileError(null)
    if (!file.name.endsWith('.txt') && file.type !== 'text/plain') {
      setFileError('Only .txt files accepted.')
      return
    }
    if (file.size > 1 * 1024 * 1024) {
      setFileError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 1 MB.`)
      return
    }
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      if (text) { onText(text); setFileName(file.name) }
    }
    reader.readAsText(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) readFile(file)
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 space-y-2">
        <p className="text-white/45 text-xs leading-relaxed">
          Go to <span className="text-white/70">claude.ai</span>, upload your PDF, and enter this prompt:
        </p>
        <div className="flex items-start gap-2 rounded-md bg-white/5 border border-white/8 px-3 py-2">
          <p className="flex-1 text-white/50 text-xs leading-relaxed font-mono">{EXTRACT_PROMPT}</p>
          <button
            onClick={copyPrompt}
            className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full border transition-colors mt-0.5 font-medium"
            style={copied ? { borderColor: 'rgba(239,68,68,0.4)', color: 'rgb(248,113,113)', background: 'rgba(239,68,68,0.08)' } : { borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="text-white/30 text-xs">Drop the downloaded .txt below, click to browse, or paste text directly into the field.</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,text/plain"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f); e.target.value = '' }}
      />
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 cursor-pointer transition-colors ${
          dragOver
            ? 'border-red-500/40 bg-red-500/5 text-red-400'
            : 'border-white/15 bg-white/[0.02] text-white/40 hover:border-white/30 hover:text-white/60'
        }`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
        </svg>
        <span className="text-xs font-medium">
          {fileName ? `Loaded: ${fileName}` : 'Drop .txt here or click to browse'}
        </span>
      </div>
      {fileError && <p className="text-xs text-red-400">{fileError}</p>}
    </div>
  )
}

const PERSON_OPTIONS = [
  'Masaaki Sato',
  'Keita Kiriya',
  'Shogo Katoh',
  'Koki Fukatsu',
  'Tai Harada',
  'Hiroko Kimura',
  'Makoto Takeuchi',
  'Tomo Anzai',
  'Takashi Futami',
  'Hiromichi Kimura',
  'Isa Frost',
  'Masaya Watanabe',
  'Tomoyo Mori',
  'Ayano Otsuka',
  'Koji Yasuda',
  'Keiji Nishiyama',
  'Elisa Fazzari',
  'Natalie Damore',
]

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

export default function DealFlowClient() {
  const [deckText, setDeckText] = useState('')
  const [personInCharge, setPersonInCharge] = useState('')
  const [contactBackground, setContactBackground] = useState('')
  const [firstContacted, setFirstContacted] = useState(todayDate())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DealFlowEntry | null>(null)
  const [history, setHistory] = useState<DealFlowEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    fetch('/api/deal-flow/history')
      .then(r => r.json())
      .then(d => setHistory(d.entries ?? []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, [])

  async function generate() {
    if (!deckText.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/deal-flow/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckText, personInCharge, contactBackground, firstContacted }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setResult(data.entry)
      setHistory(prev => [data.entry, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 pb-24">
      {/* Hero */}
      <div className="px-8 pt-16 pb-10 max-w-3xl animate-fade-up">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/" className="text-white/25 text-xs hover:text-white/50 transition-colors">
            FTI Research
          </Link>
          <span className="text-white/15 text-xs">/</span>
          <span className="text-white/45 text-xs">US Deal Flow</span>
        </div>
        <h1 className="font-display text-5xl text-white tracking-tight mb-4" style={{ letterSpacing: '-0.8px' }}>
          US Deal Flow
        </h1>
        <div className="w-12 h-[3px] bg-gradient-to-r from-red-500 to-red-600 rounded-full mb-5" />
        <p className="text-white/55 text-base leading-relaxed font-light">
          Paste extracted pitch deck text below. Claude will analyze the deck and generate a Notion-ready entry for the deal flow database.
        </p>
      </div>

      <div className="px-8 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">
        {/* Left: input form */}
        <div className="space-y-5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {/* Deck extraction instructions */}
          <ExtractionInstructions onText={setDeckText} />

          {/* Deck text */}
          <div>
            <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
              Pitch Deck Text *
            </label>
            <textarea
              value={deckText}
              onChange={e => setDeckText(e.target.value)}
              placeholder="Paste the extracted text from the pitch deck here..."
              rows={18}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 resize-y focus:outline-none focus:border-red-500/40 transition-colors leading-relaxed"
            />
          </div>

          {/* Additional fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                Person in Charge
              </label>
              <select
                value={personInCharge}
                onChange={e => setPersonInCharge(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500/40 transition-colors appearance-none"
              >
                <option value="">Select...</option>
                {PERSON_OPTIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                First Contacted
              </label>
              <input
                type="date"
                value={firstContacted}
                onChange={e => setFirstContacted(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500/40 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
              Contact Background
            </label>
            <input
              type="text"
              value={contactBackground}
              onChange={e => setContactBackground(e.target.value)}
              placeholder="e.g. Referral from Kyle Sergent from Global Opportunity Network"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-500/40 transition-colors"
            />
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={loading || !deckText.trim()}
            className="w-full py-3 rounded-full text-sm font-medium transition-colors
              bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing deck...' : 'Generate Notion Entry'}
          </button>

          {error && (
            <p className="text-red-400 text-sm px-1">{error}</p>
          )}
        </div>

        {/* Right: result + history */}
        <div className="space-y-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
          {/* Generated result */}
          {result && <DealFlowEntryView entry={result} />}

          {/* Past deal flows */}
          <div>
            <p className="text-white/25 text-xs uppercase tracking-widest font-medium mb-3">
              Past Deal Flows
            </p>
            {loadingHistory ? (
              <p className="text-white/20 text-sm">Loading...</p>
            ) : history.length === 0 ? (
              <p className="text-white/20 text-sm">No entries yet.</p>
            ) : (
              <div className="space-y-2">
                {history.map(entry => (
                  <button
                    key={entry.id}
                    onClick={() => setResult(entry)}
                    className="w-full text-left rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/5 hover:border-white/15 transition-all px-4 py-3"
                  >
                    <p className="text-white/80 text-sm font-medium truncate">{entry.companyName}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {entry.tag && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/12 text-red-400 border border-red-500/20">
                          {entry.tag}
                        </span>
                      )}
                      {entry.stage && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/45 border border-white/12">
                          {entry.stage}
                        </span>
                      )}
                      <span className="text-[10px] text-white/25 ml-auto">
                        {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
