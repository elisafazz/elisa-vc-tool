export type CompanyStatus = 'Sourced' | 'Reviewing' | 'Tracking' | 'Passed'

export interface Space {
  id: string
  name: string
  description: string
  thesis: string
  created: string
  lastSourcedAt: string | null
  alertsEnabled: boolean
  alertEmail: string | null   // email to send news digests to
  lastAlertAt: string | null  // last time a news alert was sent
}

export interface Company {
  id: string
  name: string
  spaceId: string | null        // null for standalone diligence companies
  website: string | null
  stage: string | null
  oneLiner: string | null
  description: string | null   // free-text context: what the company does, tech, indication
  pitchDeckPath: string | null // absolute path to uploaded PDF on disk
  status: CompanyStatus
  addedAt: string
  seenAt: string | null
  source: 'manual' | 'sourced' | 'standalone'
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

export interface DealFlowEntry {
  id: string
  createdAt: string
  companyName: string
  firstContacted: string
  overview: string
  tag: string | null
  country: string | null
  jobTitleName: string | null
  bioClassification: string | null
  bioDiseaseArea: string | null
  bioModality: string | null
  nextSeries: string | null
  stage: string | null
  personInCharge: string
  status: string
  websiteUrl: string | null
  contactBackground: string
}
