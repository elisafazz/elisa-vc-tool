'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function GlobalHeader() {
  const pathname = usePathname()
  const [showModal, setShowModal] = useState(false)
  const [description, setDescription] = useState('')
  const [reporterEmail, setReporterEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (showModal) setTimeout(() => textareaRef.current?.focus(), 50)
  }, [showModal])

  function open() { setShowModal(true); setSubmitted(false); setError(null) }
  function close() { setShowModal(false); setDescription(''); setReporterEmail(''); setSubmitted(false) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, reporterEmail, page: pathname }),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
      setTimeout(close, 2000)
    } catch {
      setError('Failed to send. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-2.5 border-b border-white/[0.06] bg-gray-950/90 backdrop-blur-md">
        <p className="text-white/30 text-xs font-light tracking-wide">
          Authored by <span className="text-white/50">Elisa Fazzari</span> for <span className="text-white/50">Fast Track Initiative</span>
        </p>
        <button
          onClick={open}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white/30 border border-white/[0.08] hover:text-white/60 hover:border-white/20 transition-colors"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Report a bug
        </button>
      </div>

      {/* Bug report modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-md rounded-2xl bg-gray-900 border border-white/10 shadow-2xl p-6 animate-fade-up">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="font-display text-xl text-white" style={{ letterSpacing: '-0.2px' }}>Report a Bug</h2>
                <p className="text-white/35 text-xs mt-1">This will be emailed directly to Elisa.</p>
              </div>
              <button onClick={close} className="text-white/25 hover:text-white/60 transition-colors p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <p className="text-white/70 text-sm">Bug report sent. Thanks.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-2">What went wrong? *</label>
                  <textarea
                    ref={textareaRef}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe what happened, what you expected, and what page you were on..."
                    rows={4}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 resize-none focus:outline-none focus:border-red-500/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Your email (optional)</label>
                  <input
                    type="email"
                    value={reporterEmail}
                    onChange={e => setReporterEmail(e.target.value)}
                    placeholder="so we can follow up"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-500/40 transition-colors"
                  />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={submitting || !description.trim()}
                    className="px-5 py-2.5 rounded-full text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Sending...' : 'Send report'}
                  </button>
                  <button type="button" onClick={close} className="px-5 py-2.5 rounded-full text-sm font-medium text-white/30 border border-white/8 hover:text-white/60 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
