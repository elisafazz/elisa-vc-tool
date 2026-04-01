import type { Space, Company, Research, AlertLogEntry } from './types'

// All keys prefixed with fti: to avoid collisions with other apps on the same Redis instance
const P = 'fti'

// Lazy KV client — only initialized if env vars are present.
// Returns null if KV isn't connected yet (e.g. before Vercel database is linked).
function getKV() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { kv } = require('@vercel/kv')
  return kv as import('@vercel/kv').VercelKV
}

// --- Spaces ---

export async function listSpaces(): Promise<Space[]> {
  const kv = getKV()
  if (!kv) return []
  try {
    const ids = await kv.smembers<string[]>(`${P}:idx:spaces`)
    if (!ids.length) return []
    const spaces = await Promise.all(ids.map((id: string) => kv.get<Space>(`${P}:space:${id}`)))
    return spaces.filter(Boolean) as Space[]
  } catch { return [] }
}

export async function readSpace(id: string): Promise<Space | null> {
  const kv = getKV()
  if (!kv) return null
  try { return kv.get<Space>(`${P}:space:${id}`) } catch { return null }
}

export async function writeSpace(space: Space): Promise<void> {
  const kv = getKV()
  if (!kv) return
  await Promise.all([
    kv.set(`${P}:space:${space.id}`, space),
    kv.sadd(`${P}:idx:spaces`, space.id),
  ])
}

// --- Companies ---

export async function listCompanies(spaceId?: string): Promise<Company[]> {
  const kv = getKV()
  if (!kv) return []
  try {
    const idKey = spaceId ? `${P}:idx:space:${spaceId}:companies` : `${P}:idx:companies`
    const ids = await kv.smembers<string[]>(idKey)
    if (!ids.length) return []
    const companies = await Promise.all(ids.map((id: string) => kv.get<Company>(`${P}:company:${id}`)))
    return companies.filter(Boolean) as Company[]
  } catch { return [] }
}

export async function listStandaloneCompanies(): Promise<Company[]> {
  const kv = getKV()
  if (!kv) return []
  try {
    const ids = await kv.smembers<string[]>(`${P}:idx:standalone:companies`)
    if (!ids.length) return []
    const companies = await Promise.all(ids.map((id: string) => kv.get<Company>(`${P}:company:${id}`)))
    return companies.filter(Boolean) as Company[]
  } catch { return [] }
}

export async function findCompanyByName(name: string): Promise<Company | null> {
  const kv = getKV()
  if (!kv) return null
  try {
    const ids = await kv.smembers<string[]>(`${P}:idx:companies`)
    if (!ids.length) return null
    const companies = await Promise.all(ids.map((id: string) => kv.get<Company>(`${P}:company:${id}`)))
    return (companies.filter(Boolean) as Company[]).find(
      c => c.name.toLowerCase() === name.toLowerCase()
    ) ?? null
  } catch { return null }
}

export async function readCompany(id: string): Promise<Company | null> {
  const kv = getKV()
  if (!kv) return null
  try { return kv.get<Company>(`${P}:company:${id}`) } catch { return null }
}

export async function writeCompany(company: Company): Promise<void> {
  const kv = getKV()
  if (!kv) return
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
  const kv = getKV()
  if (!kv) return null
  try { return kv.get<Research>(`${P}:research:${companyId}:${type}`) } catch { return null }
}

export async function writeResearch(research: Research): Promise<void> {
  const kv = getKV()
  if (!kv) return
  await kv.set(`${P}:research:${research.companyId}:${research.type}`, research)
}

// --- Deck text (uploaded .txt content, stored in KV for persistence) ---

export async function readDeck(companyId: string): Promise<string | null> {
  const kv = getKV()
  if (!kv) return null
  try { return kv.get<string>(`${P}:deck:${companyId}`) } catch { return null }
}

export async function writeDeck(companyId: string, text: string): Promise<void> {
  const kv = getKV()
  if (!kv) return
  await kv.set(`${P}:deck:${companyId}`, text)
}

// --- Alerts ---

export async function readAlertLog(): Promise<AlertLogEntry[]> {
  const kv = getKV()
  if (!kv) return []
  try { return (await kv.get<AlertLogEntry[]>(`${P}:alerts:log`)) ?? [] } catch { return [] }
}

export async function appendAlertLog(entry: AlertLogEntry): Promise<void> {
  const kv = getKV()
  if (!kv) return
  const log = await readAlertLog()
  log.unshift(entry)
  await kv.set(`${P}:alerts:log`, log.slice(0, 200))
}
