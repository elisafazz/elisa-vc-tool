'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

type ResearchType = 'dd' | 'competitive'

export default function DiligencePage() {
  const [companyName, setCompanyName] = useState('')
  const [description, setDescription] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [activeType, setActiveType] = useState<ResearchType | null>(null)
  const [content, setContent] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted')
      return
    }
    setPdfFile(file)
    setError(null)
  }

  function removePdf() {
    setPdfFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function run(type: ResearchType) {
    if (!companyName.trim()) return
    setError(null)
    setContent('')
    setStreaming(true)
    setActiveType(type)

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    try {
      const form = new FormData()
      form.append('companyName', companyName.trim())
      form.append('type', type)
      if (description.trim()) form.append('description', description.trim())
      if (pdfFile) form.append('pdf', pdfFile)

      const res = await fetch('/api/research/run', {
        method: 'POST',
        body: form,
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
        for (const line of chunk.split('\n')) {
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

  const hasOutput = content.length > 0 || streaming

  return (
    <main className="min-h-screen bg-gray-950 pb-24">
      {/* Header */}
      <div className="px-8 pt-12 pb-8 animate-fade-up">
        <Link href="/" className="text-white/30 text-xs hover:text-white/60 transition-colors mb-5 block">
          ← Back
        </Link>
        <h1 className="font-display text-4xl text-white tracking-tight" style={{ letterSpacing: '-0.5px' }}>
          Diligence
        </h1>
        <div className="w-10 h-[2.5px] bg-gradient-to-r from-red-500 to-red-600 rounded-full mt-3" />
        <p className="text-white/35 mt-3 text-sm font-light tracking-wide">
          Run DD or competitive landscape on any company
        </p>
      </div>

      {/* Input panel */}
      <div className="px-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="max-w-3xl space-y-4">

          {/* Company name */}
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && companyName.trim()) run('dd') }}
            placeholder="Company name"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-base focus:outline-none focus:border-red-500/40"
          />

          {/* Description */}
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What do they do? The more context you give — technology, indication, approach, stage — the more targeted the research. Example: stem cell-derived beta cell replacement for Type 1 Diabetes, preclinical stage."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder-white/25 text-sm resize-none focus:outline-none focus:border-red-500/40"
          />

          {/* PDF upload — prominent */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex items-center gap-4 rounded-xl border-2 border-dashed px-5 py-4 cursor-pointer transition-all group ${
              pdfFile
                ? 'border-red-500/40 bg-red-500/8'
                : 'border-white/15 bg-white/[0.02] hover:border-red-500/30 hover:bg-red-500/5'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
              pdfFile ? 'bg-red-500/20 border border-red-500/30' : 'bg-white/5 border border-white/10 group-hover:bg-red-500/10 group-hover:border-red-500/20'
            }`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                className={pdfFile ? 'text-red-400' : 'text-white/35 group-hover:text-red-400 transition-colors'}>
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              {pdfFile ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-red-400 text-sm font-medium truncate">{pdfFile.name}</p>
                    <p className="text-white/35 text-xs mt-0.5">
                      {(pdfFile.size / 1024 / 1024).toFixed(1)} MB — Claude will read this before searching
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); removePdf() }}
                    className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-white/50 text-sm font-medium group-hover:text-white/70 transition-colors">
                    Upload pitch deck PDF
                  </p>
                  <p className="text-white/25 text-xs mt-0.5">
                    Claude reads the deck before running web searches — improves context and accuracy
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Run buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => run('dd')}
              disabled={streaming || !companyName.trim()}
              className="px-5 py-2.5 rounded-full text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {streaming && activeType === 'dd' ? 'Running...' : 'DD at a Glance'}
            </button>
            <button
              onClick={() => run('competitive')}
              disabled={streaming || !companyName.trim()}
              className="px-5 py-2.5 rounded-full text-sm font-medium bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {streaming && activeType === 'competitive' ? 'Running...' : 'Competitive Landscape'}
            </button>
            {streaming && (
              <button
                onClick={() => abortRef.current?.abort()}
                className="px-5 py-2.5 rounded-full text-sm font-medium bg-white/5 text-white/35 border border-white/8 hover:text-white/60 transition-colors"
              >
                Stop
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Output */}
      <div className="px-8 mt-10">
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {!hasOutput && (
          <div className="flex items-center justify-center py-24">
            <p className="text-white/15 text-sm">Enter a company name and run research above.</p>
          </div>
        )}

        {hasOutput && (
          <div className="max-w-4xl">
            <div className="text-xs font-semibold text-white/25 uppercase tracking-wider mb-5">
              {activeType === 'dd' ? 'DD at a Glance' : 'Competitive Landscape'} — {companyName}
            </div>
            <pre className="whitespace-pre-wrap text-white/75 text-sm leading-relaxed font-sans">
              {content}
              {streaming && <span className="cursor-blink text-red-500 ml-0.5">|</span>}
            </pre>
          </div>
        )}
      </div>
    </main>
  )
}
