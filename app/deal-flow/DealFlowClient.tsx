'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import DealFlowEntryView from '@/components/DealFlowEntry'
import type { DealFlowEntry } from '@/lib/types'

const EXTRACT_PROMPT = `Please extract all text from this pitch deck PDF and output it as plain text. For any charts, graphs, or tables, describe their content in full detail. Output only the extracted content with no preamble or commentary. Output as a downloadable .txt file.`

// ---------------------------------------------------------------------------
// Shared: extraction instructions panel
// ---------------------------------------------------------------------------
function ExtractionInstructions({ onText, onFiles }: { onText?: (text: string) => void; onFiles?: (files: File[]) => void }) {
  const [copied, setCopied] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMulti = !!onFiles

  function copyPrompt() {
    navigator.clipboard.writeText(EXTRACT_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function validateFile(file: File): string | null {
    if (!file.name.endsWith('.txt') && file.type !== 'text/plain') return 'Only .txt files accepted.'
    if (file.size > 1 * 1024 * 1024) return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 1 MB.`
    return null
  }

  function readSingleFile(file: File) {
    setFileError(null)
    const err = validateFile(file)
    if (err) { setFileError(err); return }
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      if (text && onText) { onText(text); setFileName(file.name) }
    }
    reader.readAsText(file)
  }

  function handleMultiFiles(fileList: FileList) {
    setFileError(null)
    const valid: File[] = []
    const errors: string[] = []
    Array.from(fileList).forEach(f => {
      const err = validateFile(f)
      if (err) errors.push(`${f.name}: ${err}`)
      else valid.push(f)
    })
    if (errors.length) setFileError(errors.join(' | '))
    if (valid.length && onFiles) {
      onFiles(valid)
      setFileName(`${valid.length} file${valid.length > 1 ? 's' : ''} loaded`)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (isMulti) {
      handleMultiFiles(e.dataTransfer.files)
    } else {
      const file = e.dataTransfer.files?.[0]
      if (file) readSingleFile(file)
    }
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
        <p className="text-white/30 text-xs">
          {isMulti
            ? 'Drop multiple .txt files below or click to browse. Each file becomes one deal flow entry.'
            : 'Drop the downloaded .txt below, click to browse, or paste text directly into the field.'}
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,text/plain"
        multiple={isMulti}
        className="hidden"
        onChange={e => {
          if (isMulti && e.target.files) handleMultiFiles(e.target.files)
          else { const f = e.target.files?.[0]; if (f) readSingleFile(f) }
          e.target.value = ''
        }}
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
          {fileName ? fileName : (isMulti ? 'Drop .txt files here or click to browse' : 'Drop .txt here or click to browse')}
        </span>
      </div>
      {fileError && <p className="text-xs text-red-400">{fileError}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Person in Charge options
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Batch file item type
// ---------------------------------------------------------------------------
interface BatchFile {
  id: string
  fileName: string
  deckText: string
  personInCharge: string
  contactBackground: string
  firstContacted: string
  notes: string
  expanded: boolean
}

// ---------------------------------------------------------------------------
// Batch mode instructions
// ---------------------------------------------------------------------------
function BatchInstructions() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 space-y-3">
      <p className="text-white/60 text-sm font-medium">How to use Batch Mode</p>
      <ol className="text-white/40 text-xs leading-relaxed space-y-2 list-decimal list-inside">
        <li>
          <span className="text-white/50">Extract each pitch deck</span> - Go to claude.ai, upload each PDF, and use the extraction prompt above. Save each output as a separate .txt file.
        </li>
        <li>
          <span className="text-white/50">Upload all .txt files at once</span> - Drag and drop multiple files into the upload zone, or click to browse and select multiple files.
        </li>
        <li>
          <span className="text-white/50">Add notes per entry</span> - Expand each file card to set Person in Charge, Contact Background, First Contacted date, and any additional notes for Claude to consider during analysis.
        </li>
        <li>
          <span className="text-white/50">Generate all entries</span> - Click "Generate All Entries" to process every file. Each file is analyzed individually and produces its own Notion-ready entry.
        </li>
        <li>
          <span className="text-white/50">Review and copy</span> - Results appear as they complete. Use "Copy all" on each entry to paste into Notion.
        </li>
      </ol>
      <p className="text-white/25 text-xs">Max 20 files per batch. Each .txt file must be under 1 MB.</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Batch file card (expandable, with per-file fields)
// ---------------------------------------------------------------------------
function BatchFileCard({
  file,
  index,
  onUpdate,
  onRemove,
}: {
  file: BatchFile
  index: number
  onUpdate: (id: string, updates: Partial<BatchFile>) => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.03] transition-colors"
        onClick={() => onUpdate(file.id, { expanded: !file.expanded })}
      >
        <span className="text-white/25 text-xs font-mono w-6 text-center">{index + 1}</span>
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`text-white/30 transition-transform flex-shrink-0 ${file.expanded ? 'rotate-90' : ''}`}
        >
          <path d="M9 18l6-6-6-6"/>
        </svg>
        <span className="text-white/70 text-sm font-medium truncate flex-1">{file.fileName}</span>
        <span className="text-white/20 text-xs flex-shrink-0">
          {(file.deckText.length / 1024).toFixed(0)} KB
        </span>
        <button
          onClick={e => { e.stopPropagation(); onRemove(file.id) }}
          className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0 p-1"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Expanded fields */}
      {file.expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-medium text-white/35 uppercase tracking-wider mb-1">
                Person in Charge
              </label>
              <select
                value={file.personInCharge}
                onChange={e => onUpdate(file.id, { personInCharge: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-red-500/40 transition-colors appearance-none"
              >
                <option value="">Select...</option>
                {PERSON_OPTIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-white/35 uppercase tracking-wider mb-1">
                First Contacted
              </label>
              <input
                type="date"
                value={file.firstContacted}
                onChange={e => onUpdate(file.id, { firstContacted: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-red-500/40 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-white/35 uppercase tracking-wider mb-1">
              Contact Background
            </label>
            <input
              type="text"
              value={file.contactBackground}
              onChange={e => onUpdate(file.id, { contactBackground: e.target.value })}
              placeholder="e.g. Referral from Kyle Sergent"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-white/20 focus:outline-none focus:border-red-500/40 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-white/35 uppercase tracking-wider mb-1">
              Notes for Claude
            </label>
            <textarea
              value={file.notes}
              onChange={e => onUpdate(file.id, { notes: e.target.value })}
              placeholder="Any additional context or instructions for this specific company (e.g. 'This is a Japan-based company', 'Focus on their oncology pipeline')..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-white/20 resize-y focus:outline-none focus:border-red-500/40 transition-colors leading-relaxed"
            />
          </div>
          <div className="text-white/15 text-[10px] truncate">
            Preview: {file.deckText.slice(0, 200)}...
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function DealFlowClient() {
  // Mode toggle
  const [mode, setMode] = useState<'single' | 'batch'>('single')

  // Single mode state
  const [deckText, setDeckText] = useState('')
  const [personInCharge, setPersonInCharge] = useState('')
  const [contactBackground, setContactBackground] = useState('')
  const [firstContacted, setFirstContacted] = useState(todayDate())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DealFlowEntry | null>(null)

  // Batch mode state
  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([])
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null)
  const [batchResults, setBatchResults] = useState<{ fileName: string; entry?: DealFlowEntry; error?: string }[]>([])
  const [batchError, setBatchError] = useState<string | null>(null)

  // Shared state
  const [history, setHistory] = useState<DealFlowEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    fetch('/api/deal-flow/history')
      .then(r => r.json())
      .then(d => setHistory(d.entries ?? []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, [])

  // Single mode generate
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

  // Batch: add files
  function addBatchFiles(files: File[]) {
    const readers = files.map(file => {
      return new Promise<BatchFile>((resolve) => {
        const reader = new FileReader()
        reader.onload = e => {
          resolve({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            fileName: file.name,
            deckText: (e.target?.result as string) || '',
            personInCharge: '',
            contactBackground: '',
            firstContacted: todayDate(),
            notes: '',
            expanded: false,
          })
        }
        reader.readAsText(file)
      })
    })
    Promise.all(readers).then(newFiles => {
      setBatchFiles(prev => [...prev, ...newFiles])
    })
  }

  // Batch: update a file
  function updateBatchFile(id: string, updates: Partial<BatchFile>) {
    setBatchFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  // Batch: remove a file
  function removeBatchFile(id: string) {
    setBatchFiles(prev => prev.filter(f => f.id !== id))
  }

  // Batch: generate all
  async function generateBatch() {
    if (!batchFiles.length) return
    setBatchLoading(true)
    setBatchError(null)
    setBatchResults([])
    setBatchProgress({ done: 0, total: batchFiles.length })

    try {
      const res = await fetch('/api/deal-flow/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: batchFiles.map(f => ({
            deckText: f.deckText,
            fileName: f.fileName,
            personInCharge: f.personInCharge,
            contactBackground: f.contactBackground,
            firstContacted: f.firstContacted,
            notes: f.notes,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Batch generation failed')

      setBatchResults(data.results)
      setBatchProgress({ done: batchFiles.length, total: batchFiles.length })

      // Add successful entries to history
      const newEntries = data.results
        .filter((r: { entry?: DealFlowEntry }) => r.entry)
        .map((r: { entry: DealFlowEntry }) => r.entry)
      if (newEntries.length) {
        setHistory(prev => [...newEntries, ...prev])
      }
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setBatchLoading(false)
    }
  }

  // Expand / collapse all
  function toggleAllExpanded(expand: boolean) {
    setBatchFiles(prev => prev.map(f => ({ ...f, expanded: expand })))
  }

  // Called when an entry is successfully synced to Notion — keeps result/history/batch in sync
  function handleNotionSynced(id: string, notionPageId: string, notionPageUrl: string) {
    const patch = { notionPageId, notionPageUrl }
    setResult(prev => (prev && prev.id === id ? { ...prev, ...patch } : prev))
    setHistory(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)))
    setBatchResults(prev =>
      prev.map(r => (r.entry && r.entry.id === id ? { ...r, entry: { ...r.entry, ...patch } } : r)),
    )
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
          {mode === 'single'
            ? 'Paste extracted pitch deck text below. Claude will analyze the deck and generate a Notion-ready entry for the deal flow database.'
            : 'Upload multiple extracted pitch decks at once. Add notes to each before generating all Notion entries in one batch.'}
        </p>
      </div>

      {/* Mode toggle */}
      <div className="px-8 mb-6 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.02] p-1">
          <button
            onClick={() => setMode('single')}
            className={`px-5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              mode === 'single'
                ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                : 'text-white/40 hover:text-white/60 border border-transparent'
            }`}
          >
            Single
          </button>
          <button
            onClick={() => setMode('batch')}
            className={`px-5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              mode === 'batch'
                ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                : 'text-white/40 hover:text-white/60 border border-transparent'
            }`}
          >
            Batch
          </button>
        </div>
      </div>

      <div className="px-8 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">
        {/* Left column */}
        <div className="space-y-5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {mode === 'single' ? (
            <>
              {/* Single mode: extraction instructions */}
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

              {error && <p className="text-red-400 text-sm px-1">{error}</p>}
            </>
          ) : (
            <>
              {/* Batch mode */}
              <BatchInstructions />

              {/* Extraction prompt + multi-file upload */}
              <ExtractionInstructions onFiles={addBatchFiles} />

              {/* File queue */}
              {batchFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-white/40 text-xs uppercase tracking-wider font-medium">
                      {batchFiles.length} file{batchFiles.length > 1 ? 's' : ''} queued
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAllExpanded(true)}
                        className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                      >
                        Expand all
                      </button>
                      <span className="text-white/10 text-[10px]">|</span>
                      <button
                        onClick={() => toggleAllExpanded(false)}
                        className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                      >
                        Collapse all
                      </button>
                      <span className="text-white/10 text-[10px]">|</span>
                      <button
                        onClick={() => setBatchFiles([])}
                        className="text-[10px] text-white/30 hover:text-red-400 transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {batchFiles.map((file, i) => (
                      <BatchFileCard
                        key={file.id}
                        file={file}
                        index={i}
                        onUpdate={updateBatchFile}
                        onRemove={removeBatchFile}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Generate all button */}
              <button
                onClick={generateBatch}
                disabled={batchLoading || batchFiles.length === 0}
                className="w-full py-3 rounded-full text-sm font-medium transition-colors
                  bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {batchLoading
                  ? `Analyzing... ${batchProgress ? `(${batchProgress.done}/${batchProgress.total})` : ''}`
                  : `Generate All Entries (${batchFiles.length})`}
              </button>

              {batchError && <p className="text-red-400 text-sm px-1">{batchError}</p>}

              {/* Batch results */}
              {batchResults.length > 0 && (
                <div className="space-y-4">
                  <p className="text-white/40 text-xs uppercase tracking-wider font-medium">
                    Results ({batchResults.filter(r => r.entry).length} succeeded, {batchResults.filter(r => r.error).length} failed)
                  </p>
                  {batchResults.map((r, i) => (
                    <div key={i}>
                      {r.entry ? (
                        <DealFlowEntryView entry={r.entry} onNotionSynced={handleNotionSynced} />
                      ) : (
                        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                          <p className="text-red-400 text-sm font-medium">{r.fileName}</p>
                          <p className="text-red-400/60 text-xs mt-1">{r.error}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: result + history */}
        <div className="space-y-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
          {/* Single mode result */}
          {mode === 'single' && result && (
            <DealFlowEntryView entry={result} onNotionSynced={handleNotionSynced} />
          )}

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
                    onClick={() => { setResult(entry); setMode('single') }}
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
