// Prompts derived exactly from the Claude Code skill files:
// /company-brief SKILL.md → ddPrompt
// market-research agent → competitivePrompt
// Custom sourcing prompt → sourcingPrompt

export function ddPrompt(companyName: string, context?: string): string {
  return `Quick company analysis — 1-page brief for a meeting, intro call, or sector scan.

Company: ${companyName}
${context ? `Additional context: ${context}` : ''}

Search comprehensively before drafting:
- Company website, LinkedIn, Crunchbase, SEC/EDGAR, PitchBook press releases
- Recent news (Google News, TechCrunch, STAT News, FierceBiotech as relevant)
- Academic/clinical literature on the underlying science via PubMed if applicable

Then produce the brief below.

Output format: bullet points only — no prose. Every factual claim has a direct-linked primary source in parentheses immediately after the bullet. No subjective assessment or editorial judgment anywhere — report only what sources state.

### ${companyName} — Quick Brief

**What they do**
- [Description] (company website — link)
- [Core problem addressed] (source — link)

**Stage / Funding**
- [Stage, round size, date] (Crunchbase — link)
- [Lead investors] (source — link)

**Founding team**
- [Founder — title, prior roles] (LinkedIn — link)
- [Co-founder if applicable] (source — link)

**Product**
- [What it is, how it works] (source — link)
- [Who uses it] (source — link)
- [Business model] (source — link)

**Differentiation**
- [What the company claims sets them apart] *(Claimed — company website — link)*
- [Independent corroboration or contradiction if available] (source — link)

**Competitive landscape**
- [Competitor 1 — factual comparison] (source — link)
- [Competitor 2] (source — link)

**Traction**
- [Metric — stated exactly as reported] (source — link or *(Unverified)*)
- [Customer / partnership / regulatory milestone] (source — link)

**Scientific / clinical foundation** *(if applicable)*
- [Key supporting study or finding] (PubMed PMID — link)
- [Conflicting or cautionary finding] (PubMed PMID — link)

**Open questions**
- [Specific factual gap]
- [Specific factual gap]

**Questions to ask in the meeting**
- [Specific question]
- [Specific question]
- [Specific question]

Rules:
- Bullet points only
- Direct link on every source
- No subjective assessment, opinion, or qualitative judgment
- Do not fabricate metrics or funding rounds
- For scientific claims: cite with PubMed PMID and direct link (https://pubmed.ncbi.nlm.nih.gov/[PMID])
- Unverified: *(Unverified)* | Inferred: *(Inference)* | Company-claimed: *(Claimed)*`
}

export function competitivePrompt(companyName: string, spaceName: string, thesis?: string): string {
  return `Research ${companyName} and the ${spaceName} competitive landscape for VC diligence purposes.
${thesis ? `Space thesis: ${thesis}` : ''}

Search comprehensively before drafting:
- Company website, LinkedIn, Crunchbase, SEC/EDGAR, PitchBook press releases
- Recent news (Google News, TechCrunch, STAT News, FierceBiotech as relevant)
- Academic/clinical literature via PubMed if the topic involves science or medicine

Output format: bullet points only — no prose. Every factual claim has a direct-linked primary source in parentheses immediately after the bullet. No subjective assessment or editorial judgment — report only what sources state.

**Market overview**
- [Market size — state exact figure and who produced it] (Source — link)
- [Growth rate] (Source — link)
- [Key tailwind or regulatory driver] (Source — link)

**Competitive landscape**
- [Competitor — factual description, funding, stage] (Source — link)
- [Competitor 2] (Source — link)
- [Competitor 3] (Source — link)

**Technology / product landscape**
- [Approach or platform description] (Source — link)
- [What is novel or differentiated — note if company-claimed vs. independent] (Source — link)

**Recent news and funding activity (last 12 months)**
- [Event — stated exactly as reported] (Source — link)

**Scientific / clinical foundation** (if applicable)
- [Key supporting study or finding] (PubMed PMID — link)
- [Conflicting or cautionary finding if present] (PubMed PMID — link)

**Key risks**
- [Risk stated factually — no softening] (Source if applicable)

**Open questions for diligence**
- [Specific unanswered question]

Rules:
- Bullet points only
- Direct link on every source — no bare citations
- No subjective assessment, opinion, or qualitative judgment
- Do not fabricate metrics or funding rounds
- Unverified: *(Unverified)* | Inferred: *(Inference)* | Company-claimed: *(Claimed)*
- Conflicting sources: *(Conflicting)*`
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
