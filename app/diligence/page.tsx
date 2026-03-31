'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

type ResearchType = 'dd' | 'competitive'

export default function DiligencePage() {
  const [companyName, setCompanyName] = useState('')
  const [description, setDescription] = useState('')
  const [activeType, setActiveType] = useState<ResearchType | null>(null)
  const [content, setContent] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function run(type: ResearchType) {
    if (!companyName.trim()) return
    setError(null)
    setContent('')
    setStreaming(true)
    setActiveType(type)

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/research/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          description: description.trim() || undefined,
          type,
        }),
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
    <main className="h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <div className="flex-shrink-0 px-8 pt-12 pb-8 animate-fade-up flex items-end justify-between">
        <div>
          <Link href="/" className="text-white/30 text-xs hover:text-white/60 transition-colors mb-4 block">
            ← Back
          </Link>
          <h1 className="font-display text-4xl text-white tracking-tight" style={{ letterSpacing: '-0.5px' }}>
            Diligence
          </h1>
          <div className="w-10 h-[2.5px] bg-gradient-to-r from-amber-400 to-amber-500 rounded-full mt-3" />
          <p className="text-white/30 mt-3 text-sm font-light tracking-wide">
            Run DD or competitive landscape on any company
          </p>
        </div>
      </div>

      {/* Input panel */}
      <div className="flex-shrink-0 px-8 pb-6 space-y-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex gap-3">
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="Company name"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-amber-400/40"
          />
        </div>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe what they do — technology, indication, approach, stage... (optional but improves research quality)"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder-white/25 text-sm resize-none focus:outline-none focus:border-amber-400/40"
        />
        <div className="flex gap-3">
          <button
            onClick={() => run('dd')}
            disabled={streaming || !companyName.trim()}
            className="px-5 py-2.5 rounded-full text-sm font-medium bg-amber-400/15 text-amber-300 border border-amber-400/25 hover:bg-amber-400/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
              className="px-5 py-2.5 rounded-full text-sm font-medium bg-white/5 text-white/40 border border-white/10 hover:text-white/60 transition-colors"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto px-8 pb-12">
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {!hasOutput && (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/15 text-sm">Enter a company name and run research above.</p>
          </div>
        )}

        {hasOutput && (
          <div className="max-w-4xl">
            <div className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">
              {activeType === 'dd' ? 'DD at a Glance' : 'Competitive Landscape'} — {companyName}
            </div>
            <pre className="whitespace-pre-wrap text-white/75 text-sm leading-relaxed font-sans">
              {content}
              {streaming && <span className="cursor-blink text-amber-400 ml-0.5">|</span>}
            </pre>
          </div>
        )}
      </div>
    </main>
  )
}
