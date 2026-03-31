'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewSpacePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [thesis, setThesis] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, thesis }),
      })
      if (!res.ok) throw new Error('Failed to create space')
      router.push('/')
    } catch {
      setError('Failed to create space. Check your server.')
      setLoading(false)
    }
  }

  return (
    <main className="h-screen flex flex-col bg-gray-950">
      <div className="flex-shrink-0 px-8 pt-12 pb-6 flex items-center gap-4">
        <Link href="/" className="text-white/40 hover:text-white/60 transition-colors text-sm">
          Deal Flow
        </Link>
        <span className="text-white/20">/</span>
        <span className="text-white/60 text-sm">New Space</span>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-12">
        <div className="max-w-lg">
          <h1 className="font-display text-3xl text-white mb-1" style={{ letterSpacing: '-0.3px' }}>
            New Space
          </h1>
          <div className="w-8 h-[2px] bg-amber-400 rounded-full mb-8" />

          <form onSubmit={submit} className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-wide mb-2">
                Space Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. AI Infrastructure, Digital Therapeutics"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-amber-400/40 focus:bg-white/8 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-wide mb-2">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Short label shown on the card"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-amber-400/40 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-wide mb-2">
                Investment Thesis
              </label>
              <textarea
                value={thesis}
                onChange={e => setThesis(e.target.value)}
                placeholder="What are you looking for in this space? This guides the AI when sourcing companies."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-amber-400/40 transition-colors resize-none"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="px-6 py-2.5 rounded-full text-sm font-medium bg-amber-400/20 text-amber-300 border border-amber-400/30 hover:bg-amber-400/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Space'}
              </button>
              <Link
                href="/"
                className="px-6 py-2.5 rounded-full text-sm font-medium text-white/40 border border-white/10 hover:text-white/60 hover:border-white/20 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
