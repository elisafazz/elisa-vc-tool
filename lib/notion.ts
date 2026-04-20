import { Client } from '@notionhq/client'
import type { DealFlowEntry } from './types'

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const DATA_SOURCE_ID = process.env.NOTION_DEAL_FLOW_DATA_SOURCE_ID!

export async function createDealFlowPage(
  entry: DealFlowEntry
): Promise<{ id: string; url: string }> {
  const res = await notion.pages.create({
    parent: { type: 'data_source_id', data_source_id: DATA_SOURCE_ID } as any,
    properties: buildProperties(entry),
  } as any)
  return { id: (res as any).id, url: (res as any).url }
}

export async function pageExists(pageId: string): Promise<boolean> {
  try {
    const p = await notion.pages.retrieve({ page_id: pageId })
    return !(p as any).archived
  } catch (err: any) {
    if (err?.status === 404) return false
    throw err
  }
}

function richText(value: string | null | undefined) {
  if (!value) return { rich_text: [] }
  return { rich_text: [{ type: 'text', text: { content: value } }] }
}

function selectOrOmit(value: string | null | undefined) {
  if (!value) return undefined
  return { select: { name: value } }
}

function dateOrOmit(value: string | null | undefined) {
  if (!value) return undefined
  return { date: { start: value } }
}

function urlOrOmit(value: string | null | undefined) {
  if (!value) return undefined
  return { url: value }
}

function buildProperties(e: DealFlowEntry): Record<string, any> {
  const props: Record<string, any> = {
    'Company': {
      title: [{ type: 'text', text: { content: e.companyName || 'Untitled' } }],
    },
    'First Contacted': { date: { start: e.firstContacted } },
    'Overview': richText(e.overview),
    'Job Title/Name': richText(e.jobTitleName),
    'Related Scientist': richText(e.relatedScientist),
    'Contact Background': richText(e.contactBackground),
    'Healthtech': {
      multi_select: (e.healthtech ?? []).map(name => ({ name })),
    },
    'Person in charge': e.personInCharge
      ? { multi_select: [{ name: e.personInCharge }] }
      : { multi_select: [] },
    'NDA': { checkbox: !!e.nda },
    'NOT disclosed to': { checkbox: !!e.notDisclosed },
    'Status': e.status ? { status: { name: e.status } } : undefined,
  }

  const tag = selectOrOmit(e.tag)
  if (tag) props['Tag'] = tag
  const country = selectOrOmit(e.country)
  if (country) props['Country'] = country
  const bioClass = selectOrOmit(e.bioClassification)
  if (bioClass) props['Bio: Classification'] = bioClass
  const bioDisease = selectOrOmit(e.bioDiseaseArea)
  if (bioDisease) props['Bio: disease area'] = bioDisease
  const bioMod = selectOrOmit(e.bioModality)
  if (bioMod) props['Bio(Tx&Drag): modality'] = bioMod
  const nextSeries = selectOrOmit(e.nextSeries)
  if (nextSeries) props['Next Series'] = nextSeries
  const stage = selectOrOmit(e.stage)
  if (stage) props['Stage'] = stage

  const ndaExp = dateOrOmit(e.ndaExpired)
  if (ndaExp) props['NDA expired'] = ndaExp

  const site = urlOrOmit(e.websiteUrl)
  if (site) props['Web site (URL)'] = site

  Object.keys(props).forEach(k => {
    if (props[k] === undefined) delete props[k]
  })

  return props
}
