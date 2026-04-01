import fs from 'fs'
import path from 'path'
import type { Space, Company, Research, AlertLogEntry } from './types'

function dataDir(): string {
  return process.env.DATA_DIR ?? '/tmp/fti-data'
}

function resolve(...parts: string[]): string {
  return path.join(dataDir(), ...parts)
}

function ensureDir(dir: string) {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  } catch {}
}

function readJSON<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
  } catch {
    return null
  }
}

function writeJSON(filePath: string, data: unknown) {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

// --- Spaces ---

export function listSpaces(): Space[] {
  try {
    const dir = resolve('spaces')
    ensureDir(dir)
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => readJSON<Space>(path.join(dir, f)))
      .filter(Boolean) as Space[]
  } catch {
    return []
  }
}

export function readSpace(id: string): Space | null {
  return readJSON<Space>(resolve('spaces', `${id}.json`))
}

export function writeSpace(space: Space) {
  writeJSON(resolve('spaces', `${space.id}.json`), space)
}

// --- Companies ---

export function listCompanies(spaceId?: string): Company[] {
  try {
    const dir = resolve('companies')
    ensureDir(dir)
    const all = fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => readJSON<Company>(path.join(dir, f)))
      .filter(Boolean) as Company[]
    return spaceId ? all.filter(c => c.spaceId === spaceId) : all
  } catch {
    return []
  }
}

export function listStandaloneCompanies(): Company[] {
  try {
    const dir = resolve('companies')
    ensureDir(dir)
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => readJSON<Company>(path.join(dir, f)))
      .filter((c): c is Company => c !== null && c.source === 'standalone')
  } catch {
    return []
  }
}

export function findCompanyByName(name: string): Company | null {
  try {
    const all = listCompanies()
    return all.find(c => c.name.toLowerCase() === name.toLowerCase()) ?? null
  } catch {
    return null
  }
}

export function readCompany(id: string): Company | null {
  return readJSON<Company>(resolve('companies', `${id}.json`))
}

export function writeCompany(company: Company) {
  writeJSON(resolve('companies', `${company.id}.json`), company)
}

// --- Research ---

export function readResearch(companyId: string, type: 'dd' | 'competitive'): Research | null {
  return readJSON<Research>(resolve('research', `${companyId}-${type}.json`))
}

export function writeResearch(research: Research) {
  writeJSON(resolve('research', `${research.companyId}-${research.type}.json`), research)
}

// --- Alerts ---

export function readAlertLog(): AlertLogEntry[] {
  return readJSON<AlertLogEntry[]>(resolve('alerts', 'log.json')) ?? []
}

export function appendAlertLog(entry: AlertLogEntry) {
  const log = readAlertLog()
  log.unshift(entry)
  writeJSON(resolve('alerts', 'log.json'), log.slice(0, 200))
}
