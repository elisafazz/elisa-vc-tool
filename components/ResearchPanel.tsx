'use client'

import { useState, useRef, useEffect } from 'react'
import type { Company } from '@/lib/types'

interface Props {
  company: Company
  savedDD: string | null
  savedCompetitive: string | null
}

function StreamingReport({
  companyId,
  type,
  saved,
}: {
  companyId: string
  type: 'dd' | 'competitive'
  saved: string | null
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
        body: JSON.stringify({ companyId }),
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
            <p className="text-xs text-white/30 mt-0.5">Last generated — click Run to refresh</p>
          )}
        </div>
        <button
          onClick={run}
          disabled={streaming}
          className="px-4 py-1.5 rounded-full text-xs font-medium transition-colors bg-amber-400/15 text-amber-300 border border-amber-400/25 hover:bg-amber-400/25 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="px-5 py-2 rounded-full text-sm font-medium bg-amber-400/15 text-amber-300 border border-amber-400/25 hover:bg-amber-400/25 transition-colors"
            >
              Run {label}
            </button>
          </div>
        )}

        {content && (
          <div className="prose prose-sm prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-white/75 text-sm leading-relaxed font-sans">
              {content}
              {streaming && <span className="cursor-blink text-amber-400 ml-0.5">|</span>}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ResearchPanel({ company, savedDD, savedCompetitive }: Props) {
  const [tab, setTab] = useState<'dd' | 'competitive'>('dd')

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-white/10 px-6">
        {(['dd', 'competitive'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-3 px-1 mr-6 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-amber-400 text-white'
                : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            {t === 'dd' ? 'DD at a Glance' : 'Competitive Landscape'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === 'dd' && (
          <StreamingReport companyId={company.id} type="dd" saved={savedDD} />
        )}
        {tab === 'competitive' && (
          <StreamingReport companyId={company.id} type="competitive" saved={savedCompetitive} />
        )}
      </div>
    </div>
  )
}
