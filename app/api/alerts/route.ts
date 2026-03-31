import { NextResponse } from 'next/server'
import { readAlertLog } from '@/lib/store'

export async function GET() {
  return NextResponse.json(readAlertLog())
}
