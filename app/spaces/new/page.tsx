'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Step = 'basic' | 'questions' | 'thesis'

interface QA { q: string; a: string }

export default function NewSpacePage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('basic')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [thesis, setThesis] = useState('')
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [alertsEnabled, setAlertsEnabled] = useState(false)
  const [alertEmail, setAlertEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function askQuestions() {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/spaces/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuestions(data.questions)
      setAnswers(data.questions.map(() => ''))
      setStep('questions')
    } catch {
      setError('Failed to generate questions. You can skip and write the thesis manually.')
    } finally {
      setLoading(false)
    }
  }

  async function generateThesis() {
    setLoading(true)
    setError(null)
    try {
      const qa: QA[] = questions.map((q, i) => ({ q, a: answers[i] ?? '' })).filter(x => x.a.trim())
      const res = await fetch('/api/spaces/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, answers: qa }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setThesis(data.thesis)
      setStep('thesis')
    } catch {
      setError('Failed to generate thesis.')
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, thesis, alertsEnabled, alertEmail: alertsEnabled ? alertEmail : null }),
      })
      if (!res.ok) throw new Error('Failed to create space')
      router.push('/')
    } catch {
      setError('Failed to create space.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 pb-24">
      <div className="px-8 pt-12 pb-6 flex items-center gap-3">
        <Link href="/" className="text-white/40 hover:text-white/60 transition-colors text-sm">Deal Flow</Link>
        <span className="text-white/20">/</span>
        <span className="text-white/60 text-sm">New Space</span>
      </div>

      <div className="px-8">
        <div className="max-w-lg">
          <h1 className="font-display text-3xl text-white mb-1" style={{ letterSpacing: '-0.3px' }}>New Space</h1>
          <div className="w-8 h-[2px] bg-red-500 rounded-full mb-8" />

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-8">
            {(['basic', 'questions', 'thesis'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  step === s ? 'bg-red-500 text-white' :
                  (step === 'questions' && s === 'basic') || (step === 'thesis' && s !== 'thesis') ? 'bg-red-500/30 text-red-400' :
                  'bg-white/8 text-white/30'
                }`}>{i + 1}</div>
                <span className={`text-xs transition-colors ${step === s ? 'text-white/70' : 'text-white/25'}`}>
                  {s === 'basic' ? 'Details' : s === 'questions' ? 'Refine' : 'Thesis'}
                </span>
                {i < 2 && <span className="text-white/15 text-xs mx-1">›</span>}
              </div>
            ))}
          </div>

          {/* Step 1: Basic info */}
          {step === 'basic' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-wide mb-2">Space Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. T1D Cell Therapy, AI Infrastructure"
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-500/40 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-wide mb-2">Short Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="One line shown on the card"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-500/40 transition-colors"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={askQuestions}
                  disabled={loading || !name.trim()}
                  className="px-5 py-2.5 rounded-full text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Thinking...' : 'Refine with Claude'}
                </button>
                <button
                  onClick={() => setStep('thesis')}
                  disabled={!name.trim()}
                  className="px-5 py-2.5 rounded-full text-sm font-medium text-white/40 border border-white/10 hover:text-white/60 hover:border-white/20 disabled:opacity-40 transition-colors"
                >
                  Write thesis manually
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Claude's clarifying questions */}
          {step === 'questions' && (
            <div className="space-y-6">
              <p className="text-white/45 text-sm leading-relaxed">
                Claude has a few questions to sharpen the investment thesis for <span className="text-white/70">{name}</span>.
              </p>

              {questions.map((q, i) => (
                <div key={i}>
                  <label className="block text-sm text-white/70 mb-2 leading-relaxed">{q}</label>
                  <textarea
                    value={answers[i] ?? ''}
                    onChange={e => {
                      const next = [...answers]
                      next[i] = e.target.value
                      setAnswers(next)
                    }}
                    rows={2}
                    placeholder="Your answer..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-500/40 transition-colors resize-none"
                  />
                </div>
              ))}

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={generateThesis}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-full text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 disabled:opacity-40 transition-colors"
                >
                  {loading ? 'Generating thesis...' : 'Generate thesis'}
                </button>
                <button
                  onClick={() => setStep('basic')}
                  className="px-5 py-2.5 rounded-full text-sm font-medium text-white/30 border border-white/8 hover:text-white/60 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review + save */}
          {step === 'thesis' && (
            <div className="space-y-5">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2 font-medium">Space</p>
                <p className="text-white text-base font-medium">{name}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-wide mb-2">
                  Investment Thesis
                </label>
                <textarea
                  value={thesis}
                  onChange={e => setThesis(e.target.value)}
                  placeholder="Describe the kind of companies you're looking for in this space..."
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-500/40 transition-colors resize-none"
                />
                <p className="text-white/25 text-xs mt-1.5">This thesis guides Claude when sourcing new companies. Edit freely.</p>
              </div>

              {/* Email alert toggle */}
              <div className={`rounded-xl border p-4 transition-colors ${alertsEnabled ? 'border-red-500/30 bg-red-500/8' : 'border-white/10 bg-white/[0.02]'}`}>
                <button
                  type="button"
                  onClick={() => setAlertsEnabled(v => !v)}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${alertsEnabled ? 'bg-red-500/20 border border-red-500/30' : 'bg-white/5 border border-white/10'}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={alertsEnabled ? 'text-red-400' : 'text-white/35'}>
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-medium transition-colors ${alertsEnabled ? 'text-white/80' : 'text-white/50'}`}>Weekly email alerts</p>
                      <p className="text-white/30 text-xs mt-0.5">
                        {alertsEnabled ? 'Sends every Monday — funding, FDA, company news' : 'Get weekly digests of news, funding, FDA updates, and company announcements in this space'}
                      </p>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${alertsEnabled ? 'bg-red-500' : 'bg-white/15'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${alertsEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </button>

                {alertsEnabled && (
                  <div className="mt-4 pt-4 border-t border-white/8">
                    <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Send alerts to</label>
                    <input
                      type="email"
                      value={alertEmail}
                      onChange={e => setAlertEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-500/40 transition-colors"
                    />
                    <p className="text-white/25 text-xs mt-1.5">Digest sent every Monday at 8am UTC. Covers new companies, FDA approvals, funding rounds, and company announcements.</p>
                  </div>
                )}
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={save}
                  disabled={loading || !name.trim()}
                  className="px-6 py-2.5 rounded-full text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Space'}
                </button>
                <button
                  onClick={() => setStep('questions')}
                  disabled={questions.length === 0}
                  className="px-5 py-2.5 rounded-full text-sm font-medium text-white/30 border border-white/8 hover:text-white/60 disabled:opacity-0 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
