import { NextResponse } from 'next/server'
import { listDealFlows } from '@/lib/store'

export async function GET() {
  try {
    const entries = await listDealFlows()
    return NextResponse.json({ entries })
  } catch {
    return NextResponse.json({ entries: [] })
  }
}
