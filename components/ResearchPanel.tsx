'use client'

import { useState, useRef } from 'react'
import type { Company } from '@/lib/types'

const EXTRACT_PROMPT = `Please extract all text from this pitch deck PDF and output it as plain text. For any charts, graphs, or tables, describe their content in full detail. Output only the extracted content with no preamble or commentary. Output as a downloadable .txt file.`

function DeckUploadPanel({
  fileInputRef,
  deckName,
  uploading,
  uploadError,
  onFile,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>
  deckName: string | null
  uploading: boolean
  uploadError: string | null
  onFile: (file: File) => void
}) {
  const [copied, setCopied] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  function copyPrompt() {
    navigator.clipboard.writeText(EXTRACT_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
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
        <p className="text-white/30 text-xs">Save the response as a .txt file, then upload below.</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,text/plain"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }}
      />
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 cursor-pointer transition-colors ${
          dragOver
            ? 'border-red-500/40 bg-red-500/5 text-red-400'
            : uploading
            ? 'border-white/10 bg-white/[0.02] text-white/30 cursor-default'
            : 'border-white/15 bg-white/[0.02] text-white/40 hover:border-white/30 hover:text-white/60'
        }`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
        </svg>
        <span className="text-xs font-medium">
          {uploading ? 'Uploading...' : deckName ? `Replace: ${deckName}` : 'Drop .txt here or click to browse'}
        </span>
      </div>
      {uploadError && <span className="text-xs text-red-400">{uploadError}</span>}
    </div>
  )
}

interface Props {
  company: Company
  savedDD: string | null
  savedCompetitive: string | null
}

function StreamingReport({
  companyId,
  type,
  saved,
  description,
}: {
  companyId: string
  type: 'dd' | 'competitive'
  saved: string | null
  description: string
}) {
  const [content, setContent] = useState(saved ?? '')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function run() {
    setError(null)
    setStreaming(true)
    setContent('')

    abortRef.current = new AbortController()

    try {
      const endpoint = type === 'dd' ? '/api/research/dd' : '/api/research/competitive'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, description: description.trim() || undefined }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) {
        setError('Research request failed')
        setStreaming(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) setContent(prev => prev + parsed.text)
            } catch {}
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') setError('Stream interrupted')
    } finally {
      setStreaming(false)
    }
  }

  const label = type === 'dd' ? 'DD at a Glance' : 'Competitive Landscape'
  const isEmpty = !content

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <h3 className="text-sm font-semibold text-white/80">{label}</h3>
          {content && !streaming && (
            <p className="text-xs text-white/30 mt-0.5">Last generated - click Run to refresh</p>
          )}
        </div>
        <button
          onClick={run}
          disabled={streaming}
          className="px-4 py-1.5 rounded-full text-xs font-medium transition-colors bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {streaming ? 'Running...' : isEmpty ? 'Run' : 'Re-run'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        {isEmpty && !streaming && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <p className="text-white/25 text-sm">No research yet.</p>
            <button
              onClick={run}
              className="px-5 py-2 rounded-full text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 transition-colors"
            >
              Run {label}
            </button>
          </div>
        )}

        {content && (
          <div className="prose prose-sm prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-white/75 text-sm leading-relaxed font-sans">
              {content}
              {streaming && <span className="cursor-blink text-red-500 ml-0.5">|</span>}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ResearchPanel({ company, savedDD, savedCompetitive }: Props) {
  const [tab, setTab] = useState<'dd' | 'competitive'>('dd')
  const [description, setDescription] = useState(company.description ?? '')
  const [deckName, setDeckName] = useState<string | null>(
    company.pitchDeckPath ? company.pitchDeckPath.split('/').pop() ?? null : null
  )
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function saveDescription() {
    await fetch(`/api/companies`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: company.id, description: description.trim() || null }),
    })
  }

  const TXT_SIZE_LIMIT = 1 * 1024 * 1024

  async function handleFile(file: File) {
    const isTxt = file.type === 'text/plain' || file.name.endsWith('.txt')
    if (!isTxt) { setUploadError('Only .txt files accepted. Open the PDF in Claude, ask it to extract all text, save the response as .txt.'); return }
    if (file.size > TXT_SIZE_LIMIT) {
      setUploadError(`Text file too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 1 MB.`)
      return
    }
    setUploadError(null)
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`/api/companies/${company.id}/upload`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setUploadError(json.error ?? 'Upload failed')
      } else {
        setDeckName(file.name)
      }
    } catch {
      setUploadError('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Context section */}
      <div className="px-6 py-4 border-b border-white/10 space-y-3">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Context for Claude</p>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          onBlur={saveDescription}
          placeholder="Describe what this company does - technology, indication, approach, stage..."
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/25 resize-none focus:outline-none focus:border-red-500/40"
        />
        <DeckUploadPanel
          fileInputRef={fileInputRef}
          deckName={deckName}
          uploading={uploading}
          uploadError={uploadError}
          onFile={handleFile}
        />
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-white/10 px-6">
        {(['dd', 'competitive'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-3 px-1 mr-6 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-red-500 text-white'
                : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            {t === 'dd' ? 'DD at a Glance' : 'Competitive Landscape'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === 'dd' && (
          <StreamingReport companyId={company.id} type="dd" saved={savedDD} description={description} />
        )}
        {tab === 'competitive' && (
          <StreamingReport companyId={company.id} type="competitive" saved={savedCompetitive} description={description} />
        )}
      </div>
    </div>
  )
}
