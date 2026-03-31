export type CompanyStatus = 'Sourced' | 'Reviewing' | 'Tracking' | 'Passed'

export interface Space {
  id: string
  name: string
  description: string
  thesis: string
  created: string
  lastSourcedAt: string | null
}

export interface Company {
  id: string
  name: string
  spaceId: string
  website: string | null
  stage: string | null
  oneLiner: string | null
  status: CompanyStatus
  addedAt: string
  seenAt: string | null
  source: 'manual' | 'sourced'
}

export interface Research {
  companyId: string
  type: 'dd' | 'competitive'
  content: string
  generatedAt: string
}

export interface AlertLogEntry {
  spaceId: string
  spaceName: string
  companyIds: string[]
  timestamp: string
  emailSent: boolean
}
