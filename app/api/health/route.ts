import { NextResponse } from 'next/server'

export async function GET() {
  // Find REST API credentials from any known env var naming convention
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    Object.entries(process.env).find(([k]) => k.endsWith('KV_REST_API_URL'))?.[1] ||
    Object.entries(process.env).find(([k]) => k.endsWith('UPSTASH_REDIS_REST_URL'))?.[1]

  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    Object.entries(process.env).find(([k]) => k.endsWith('KV_REST_API_TOKEN'))?.[1] ||
    Object.entries(process.env).find(([k]) => k.endsWith('UPSTASH_REDIS_REST_TOKEN'))?.[1]

  // Show which env vars look Redis/KV related
  const redisKeys = Object.keys(process.env).filter(k =>
    k.includes('KV') || k.includes('REDIS') || k.includes('UPSTASH')
  )

  if (!url || !token) {
    return NextResponse.json({ kv: 'missing', redisKeys })
  }

  try {
    const { Redis } = require('@upstash/redis')
    const r = new Redis({ url, token })
    await r.set('fti:health', 'ok')
    const val = await r.get('fti:health')
    return NextResponse.json({ kv: 'connected', readback: val, redisKeys })
  } catch (err: unknown) {
    return NextResponse.json({ kv: 'error', error: String(err), redisKeys })
  }
}
