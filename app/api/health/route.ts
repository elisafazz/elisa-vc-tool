import { NextResponse } from 'next/server'

export async function GET() {
  // Show ALL env var keys so we can see exactly what Vercel set
  const allKeys = Object.keys(process.env).sort()

  // Try every possible approach to connect to Redis/KV
  const attempts: Record<string, string> = {}

  // Attempt 1: standard @vercel/kv
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = require('@vercel/kv')
      await kv.set('fti:health', 'ok')
      const v = await kv.get('fti:health')
      attempts['vercel/kv'] = `connected, readback=${v}`
    } catch (e) { attempts['vercel/kv'] = `error: ${e}` }
  } else {
    attempts['vercel/kv'] = 'skipped - KV_REST_API_URL/TOKEN not set'
  }

  // Attempt 2: parse fti_REDIS_URL
  const redisUrl = process.env.fti_REDIS_URL
  if (redisUrl) {
    try {
      const parsed = new URL(redisUrl)
      const token = parsed.password
      const host = parsed.hostname
      attempts['fti_REDIS_URL_parsed'] = `host=${host}, token=${token ? 'present' : 'MISSING'}`
      if (token && host) {
        const { Redis } = require('@upstash/redis')
        const r = new Redis({ url: `https://${host}`, token })
        await r.set('fti:health', 'ok')
        const v = await r.get('fti:health')
        attempts['upstash/redis via fti_REDIS_URL'] = `connected, readback=${v}`
      }
    } catch (e) { attempts['upstash/redis via fti_REDIS_URL'] = `error: ${e}` }
  } else {
    attempts['fti_REDIS_URL'] = 'not set'
  }

  // Attempt 3: look for any *_KV_REST_API_URL pattern
  const kvUrlKey = Object.keys(process.env).find(k => k.endsWith('KV_REST_API_URL'))
  const kvTokenKey = Object.keys(process.env).find(k => k.endsWith('KV_REST_API_TOKEN'))
  if (kvUrlKey && kvTokenKey) {
    attempts['custom prefix KV'] = `found ${kvUrlKey} and ${kvTokenKey}`
    try {
      const { Redis } = require('@upstash/redis')
      const r = new Redis({ url: process.env[kvUrlKey]!, token: process.env[kvTokenKey]! })
      await r.set('fti:health', 'ok')
      const v = await r.get('fti:health')
      attempts['upstash/redis via custom prefix'] = `connected, readback=${v}`
    } catch (e) { attempts['upstash/redis via custom prefix'] = `error: ${e}` }
  }

  return NextResponse.json({ allKeys, attempts })
}
