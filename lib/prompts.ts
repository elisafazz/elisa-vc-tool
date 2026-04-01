// Prompts derived from Claude Code skill files + enhanced for context-aware research:
// /company-brief SKILL.md → ddPrompt
// market-research agent → competitivePrompt (enhanced for multi-dimensional landscape)
// Custom sourcing prompt → sourcingPrompt

export function ddPrompt(companyName: string, description?: string | null): string {
  const contextBlock = description?.trim()
    ? `\nWhat we know about this company:\n${description.trim()}\n`
    : ''

  return `Quick company analysis - 1-page brief for a meeting, intro call, or sector scan.

Company: ${companyName}${contextBlock}
Search comprehensively before drafting:
- Company website, LinkedIn, Crunchbase, SEC/EDGAR, PitchBook press releases
- Recent news (Google News, TechCrunch, STAT News, FierceBiotech as relevant)
- Academic/clinical literature on the underlying science via PubMed
- ClinicalTrials.gov if the company is clinical-stage

IMPORTANT: You must output ALL sections below in order, using the exact headings shown. Never skip a section. If information is unavailable for a section, write a single bullet: "- Not found." Do not merge or rename sections.

Output format: bullet points only - no prose. Every factual claim has a direct-linked primary source in parentheses immediately after the bullet. No subjective assessment or editorial judgment - report only what sources state.

### ${companyName} - DD at a Glance

**What they do**
- [Description of product/platform] (company website - link)
- [Core problem addressed and target customer/patient] (source - link)

**Stage / Funding**
- [Development or commercial stage] (source - link)
- [Most recent round: size, date, lead investors] (Crunchbase - link)
- [Total funding raised] (Crunchbase - link)

**Founding team**
- [Founder - title, prior company, prior role] (LinkedIn - link)
- [Co-founder or key executive if applicable] (LinkedIn - link)

**Product / Technology**
- [Mechanism or technical approach - how it works] (source - link)
- [Indication, use case, or customer segment] (source - link)
- [Business model] (source - link)

**Key scientific concepts**
- [Core biological, chemical, or technical concept underpinning the approach] (source - link)
- [Second key concept if applicable] (source - link)

**Prevailing disease treatment theory**
- [What the scientific/medical community currently believes is the right way to treat or address this disease or problem - e.g., "lowering of mutant HTT protein in Huntington's disease", "amyloid clearance in Alzheimer's"] (source - link)
- [Does this company's approach align with, challenge, or diverge from that prevailing theory? State factually.] (source - link or *(Inference)*)

**Seminal papers**
- [Author et al., Year - finding relevant to this approach] (PubMed PMID - link)
- [Author et al., Year - second key paper] (PubMed PMID - link)
- [Conflicting or cautionary study if applicable] (PubMed PMID - link)

**Clinical pipeline** *(skip bullets if pre-clinical or non-clinical)*
- [Trial ID, phase, indication, status, primary endpoint] (ClinicalTrials.gov NCT - link)

**Differentiation**
- [What the company claims sets them apart] *(Claimed)* (company website - link)
- [Independent corroboration or contradiction if found] (source - link)

**Competitive landscape**
- [Competitor or approach 1 - key difference] (source - link)
- [Competitor or approach 2] (source - link)

**Traction**
- [Metric stated exactly as reported] (source - link or *(Unverified)*)
- [Partnership, regulatory, or clinical milestone] (source - link)

**Key risks**
- [Scientific, clinical, regulatory, competitive, or commercial risk - factual only] (source - link or *(Inference)*)
- [Second risk] (source - link or *(Inference)*)

**Open questions**
- [Specific factual gap that would materially change the view]
- [Second gap]

**Questions to ask in the meeting**
- [Specific question]
- [Specific question]
- [Specific question]

Rules:
- ALL sections required - write "- Not found." if no data available
- Bullet points only, no prose
- Direct link on every source
- No subjective assessment, opinion, or qualitative judgment
- Do not fabricate metrics, funding rounds, trial IDs, or study results
- For PubMed: always include PMID and link https://pubmed.ncbi.nlm.nih.gov/[PMID]
- For ClinicalTrials: always include NCT and link https://clinicaltrials.gov/study/[NCT]
- Unverified: *(Unverified)* | Inferred: *(Inference)* | Company-claimed: *(Claimed)*`
}

export function competitivePrompt(
  companyName: string,
  description?: string | null,
  spaceName?: string | null,
  thesis?: string | null
): string {
  const contextBlock = description?.trim()
    ? `\nWhat we know about this company:\n${description.trim()}\n`
    : ''

  const spaceBlock = spaceName ? `\nInvestment space: ${spaceName}${thesis ? `\nThesis: ${thesis}` : ''}` : ''

  return `You are a VC analyst running competitive and landscape diligence on ${companyName}.
${contextBlock}${spaceBlock}

Your task is to map the full competitive and scientific landscape relevant to this company - not just direct competitors, but ALL approaches addressing the same problem.

First, use web search to characterize the company: disease area or market, specific modality or approach, development stage, and key differentiation claim.

IMPORTANT: You must output ALL sections below in order, using the exact headings shown. Never skip a section. If information is unavailable for a section, write a single bullet: "- Not found." Do not merge or rename sections.

Output format: bullet points only - no prose. Every factual claim has a direct-linked primary source in parentheses immediately after the bullet. No subjective assessment or editorial judgment - report only what sources state.

### ${companyName} - Competitive Landscape

**Disease / market overview**
- [Epidemiology or market size - exact figure] (source - link)
- [Standard of care or incumbent solution] (source - link)
- [Key unmet need this company addresses] (source - link)
- [Relevant regulatory body and pathway] (source - link)

**Key scientific concepts**
- [Core biological, chemical, or technical concept relevant to this space] (source - link)
- [Second key concept] (source - link)
- [Third key concept if applicable] (source - link)

**Seminal papers**
- [Author et al., Year - foundational finding for this approach] (PubMed PMID - link)
- [Author et al., Year - second key paper] (PubMed PMID - link)
- [Author et al., Year - conflicting or cautionary study] (PubMed PMID - link)

**All competing modalities**
For EACH distinct approach addressing the same disease or problem:
- [Approach name - mechanism - lead companies - stage - funding] (source - link)
- [Second approach] (source - link)
- [Third approach] (source - link)

**Clinical pipeline**
Search ClinicalTrials.gov for active and completed trials in this indication:
- [NCT number - sponsor - phase - primary endpoint - status] (ClinicalTrials.gov - link)
- [Second trial] (ClinicalTrials.gov - link)

**Regulatory landscape**
- [Precedent approval or clearance in this space] (FDA.gov or EMA - link)
- [Relevant guidance document] (source - link)
- [Regulatory risk specific to this modality] (source - link or *(Inference)*)

**Funding activity (last 24 months)**
Rounds, partnerships, acquisitions across the space:
- [Company - round size - date - lead investors - strategic rationale] (Crunchbase or press release - link)
- [Second deal] (source - link)

**Key risks**
- [Scientific, clinical, regulatory, competitive, or commercial risk - factual only] (source - link or *(Inference)*)
- [Second risk] (source - link or *(Inference)*)
- [Third risk] (source - link or *(Inference)*)

**Open questions for diligence**
- [Specific unanswered factual question that would materially change the investment view]
- [Second question]
- [Third question]

Rules:
- ALL sections required - write "- Not found." if no data available
- Bullet points only, no prose paragraphs
- Direct link on every source - no bare citations
- No subjective assessment, opinion, or qualitative judgment
- Do not fabricate trial IDs, funding rounds, or study results
- For PubMed: always include PMID and link https://pubmed.ncbi.nlm.nih.gov/[PMID]
- For ClinicalTrials: always include NCT and link https://clinicaltrials.gov/study/[NCT]
- Unverified: *(Unverified)* | Inferred: *(Inference)* | Company-claimed: *(Claimed)* | Conflicting: *(Conflicting)*`
}

export function sourcingPrompt(spaceName: string, thesis: string, existingNames: string[]): string {
  return `You are a VC research analyst. Find companies operating in the following space for deal flow sourcing.

Space: ${spaceName}
Thesis: ${thesis}

Search the web comprehensively for startups and companies in this space. Look at:
- Crunchbase, PitchBook press releases, AngelList
- TechCrunch, VentureBeat, relevant trade publications
- Google News for recent funding announcements
- LinkedIn for company pages
- Sector-specific databases as relevant

Return ONLY companies NOT in this list (already tracked): ${existingNames.length > 0 ? existingNames.join(', ') : 'none'}

Return your findings as a JSON array with this exact structure (no markdown, raw JSON only):
[
  {
    "name": "Company Name",
    "website": "https://company.com",
    "oneLiner": "One sentence description of what they do",
    "stage": "Seed / Series A / etc or null if unknown"
  }
]

Find at least 5 and up to 15 companies. Only include real, verifiable companies with public web presence. Do not fabricate.`
}

export function spaceNewsPrompt(spaceName: string, thesis: string, trackedCompanies: string[]): string {
  const companyList = trackedCompanies.length > 0
    ? `\nCurrently tracked companies in this space: ${trackedCompanies.join(', ')}`
    : ''

  return `You are a VC research analyst monitoring the "${spaceName}" investment space.

Investment thesis: ${thesis}${companyList}

Search comprehensively for news and developments from the PAST 7 DAYS in this space. Cover ALL of the following:

**New Companies & Funding**
- New startups announced or emerged in this space
- Funding rounds (seed, Series A–D, growth) - company, amount, date, investors, strategic rationale
- M&A, acqui-hires, or exits
Sources: Crunchbase, TechCrunch, VentureBeat, STAT News, FierceBiotech, press releases

**Regulatory & Clinical**
- FDA approvals, clearances, rejections, or Complete Response Letters in this space
- IND filings, NDA/BLA submissions
- EMA decisions or CHMP opinions
- New clinical trials initiated (ClinicalTrials.gov)
- Published trial results or interim data
Sources: FDA.gov, EMA.europa.eu, ClinicalTrials.gov, SEC EDGAR (8-K filings), press releases

**Company Announcements** (for tracked companies especially, but scan broadly)
- Partnerships, licensing deals, collaborations
- Pipeline updates, pivots, new indications
- Leadership changes (CEO, CSO, CMO hires or departures)
- Scientific publications in peer-reviewed journals
Sources: Company IR pages, SEC EDGAR, PubMed, PRNewswire, BusinessWire

**Market & Competitive Intelligence**
- New competitive entrants or modalities
- Academic breakthroughs that could affect the space
- Payer coverage decisions or reimbursement changes
- Policy or legislation changes relevant to the space
Sources: Nature, Science, NEJM, JAMA, legislative databases, payer coverage databases

Output format:
- Group by category (Funding, Regulatory, Announcements, Intelligence)
- Each item: short title in bold, 1–2 sentence description, date if known, direct source link
- If no news found in a category, write "Nothing notable this week."
- Flag items relevant to tracked companies with *(Tracked)*
- Do not fabricate - only report verifiable developments
- If a story has no source link available, mark it *(Unverified)*`
}
