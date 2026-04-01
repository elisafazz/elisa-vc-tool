import { kv } from '@vercel/kv'
import type { Space, Company, Research, AlertLogEntry } from './types'

// All keys prefixed with fti: to avoid collisions with other apps on the same Redis instance
const P = 'fti'

// --- Spaces ---

export async function listSpaces(): Promise<Space[]> {
  const ids = await kv.smembers<string[]>(`${P}:idx:spaces`)
  if (!ids.length) return []
  const spaces = await Promise.all(ids.map(id => kv.get<Space>(`${P}:space:${id}`)))
  return (spaces.filter(Boolean) as Space[])
}

export async function readSpace(id: string): Promise<Space | null> {
  return kv.get<Space>(`${P}:space:${id}`)
}

export async function writeSpace(space: Space): Promise<void> {
  await Promise.all([
    kv.set(`${P}:space:${space.id}`, space),
    kv.sadd(`${P}:idx:spaces`, space.id),
  ])
}

// --- Companies ---

export async function listCompanies(spaceId?: string): Promise<Company[]> {
  const idKey = spaceId ? `${P}:idx:space:${spaceId}:companies` : `${P}:idx:companies`
  const ids = await kv.smembers<string[]>(idKey)
  if (!ids.length) return []
  const companies = await Promise.all(ids.map(id => kv.get<Company>(`${P}:company:${id}`)))
  return (companies.filter(Boolean) as Company[])
}

export async function listStandaloneCompanies(): Promise<Company[]> {
  const ids = await kv.smembers<string[]>(`${P}:idx:standalone:companies`)
  if (!ids.length) return []
  const companies = await Promise.all(ids.map(id => kv.get<Company>(`${P}:company:${id}`)))
  return (companies.filter(Boolean) as Company[])
}

export async function findCompanyByName(name: string): Promise<Company | null> {
  const ids = await kv.smembers<string[]>(`${P}:idx:companies`)
  if (!ids.length) return null
  const companies = await Promise.all(ids.map(id => kv.get<Company>(`${P}:company:${id}`)))
  return (companies.filter(Boolean) as Company[]).find(
    c => c.name.toLowerCase() === name.toLowerCase()
  ) ?? null
}

export async function readCompany(id: string): Promise<Company | null> {
  return kv.get<Company>(`${P}:company:${id}`)
}

export async function writeCompany(company: Company): Promise<void> {
  const ops: Promise<unknown>[] = [
    kv.set(`${P}:company:${company.id}`, company),
    kv.sadd(`${P}:idx:companies`, company.id),
  ]
  if (company.spaceId) {
    ops.push(kv.sadd(`${P}:idx:space:${company.spaceId}:companies`, company.id))
  } else {
    ops.push(kv.sadd(`${P}:idx:standalone:companies`, company.id))
  }
  await Promise.all(ops)
}

// --- Research ---

export async function readResearch(companyId: string, type: 'dd' | 'competitive'): Promise<Research | null> {
  return kv.get<Research>(`${P}:research:${companyId}:${type}`)
}

export async function writeResearch(research: Research): Promise<void> {
  await kv.set(`${P}:research:${research.companyId}:${research.type}`, research)
}

// --- Deck text (uploaded .txt content, stored in KV for persistence) ---

export async function readDeck(companyId: string): Promise<string | null> {
  return kv.get<string>(`${P}:deck:${companyId}`)
}

export async function writeDeck(companyId: string, text: string): Promise<void> {
  await kv.set(`${P}:deck:${companyId}`, text)
}

// --- Alerts ---

export async function readAlertLog(): Promise<AlertLogEntry[]> {
  return (await kv.get<AlertLogEntry[]>(`${P}:alerts:log`)) ?? []
}

export async function appendAlertLog(entry: AlertLogEntry): Promise<void> {
  const log = await readAlertLog()
  log.unshift(entry)
  await kv.set(`${P}:alerts:log`, log.slice(0, 200))
}
