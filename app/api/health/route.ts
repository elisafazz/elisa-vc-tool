import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN

  if (!url || !token) {
    return NextResponse.json({
      kv: 'missing',
      KV_REST_API_URL: url ? 'set' : 'MISSING',
      KV_REST_API_TOKEN: token ? 'set' : 'MISSING',
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('KV') || k.includes('REDIS')),
    })
  }

  try {
    const { kv } = require('@vercel/kv')
    await kv.set('fti:health:check', 'ok')
    const val = await kv.get('fti:health:check')
    return NextResponse.json({ kv: 'connected', readback: val })
  } catch (err: unknown) {
    return NextResponse.json({ kv: 'error', error: String(err) })
  }
}
