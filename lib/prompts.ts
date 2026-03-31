// Prompts derived from Claude Code skill files + enhanced for context-aware research:
// /company-brief SKILL.md → ddPrompt
// market-research agent → competitivePrompt (enhanced for multi-dimensional landscape)
// Custom sourcing prompt → sourcingPrompt

export function ddPrompt(companyName: string, description?: string | null): string {
  const contextBlock = description?.trim()
    ? `\nWhat we know about this company:\n${description.trim()}\n`
    : ''

  return `Quick company analysis — 1-page brief for a meeting, intro call, or sector scan.

Company: ${companyName}${contextBlock}
Search comprehensively before drafting:
- Company website, LinkedIn, Crunchbase, SEC/EDGAR, PitchBook press releases
- Recent news (Google News, TechCrunch, STAT News, FierceBiotech as relevant)
- Academic/clinical literature on the underlying science via PubMed if applicable
- ClinicalTrials.gov if the company is clinical-stage

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

**Product / Technology**
- [What it is, how it works] (source — link)
- [Who uses it / indication / customer] (source — link)
- [Business model] (source — link)

**Differentiation**
- [What the company claims sets them apart] *(Claimed — company website — link)*
- [Independent corroboration or contradiction if available] (source — link)

**Competitive landscape**
- [Competitor 1 — factual comparison] (source — link)
- [Competitor 2] (source — link)

**Traction**
- [Metric — stated exactly as reported] (source — link or *(Unverified)*)
- [Customer / partnership / regulatory / clinical milestone] (source — link)

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

Your task is to map the full competitive and scientific landscape relevant to this company — not just direct competitors, but ALL approaches addressing the same problem.

STEP 1 — Characterize the company
Using the context above and web search, establish:
- Disease area or market (e.g., Type 1 Diabetes, enterprise security, logistics)
- Specific modality or approach (e.g., stem cell-derived beta cell replacement, LLM-based SIEM, autonomous last-mile delivery)
- Development stage (preclinical / clinical / commercial)
- Key differentiation claim

STEP 2 — Research the full landscape across ALL of the following dimensions:

**Disease / market overview**
- Epidemiology or market size — state exact figure and source
- Standard of care or incumbent solution
- Key unmet need this company addresses
- Relevant regulatory body / pathway (FDA, EMA, FTC, etc.)
Sources: PubMed, clinical guidelines, WHO, market research firms, news

**All competing modalities**
For EACH distinct approach addressing the same disease or problem — even if not the same modality as the company:
- Approach name, mechanism, lead companies, stage, funding
- Example: for a T1D cell therapy company, cover: autologous cell therapy, allogeneic cell therapy, gene therapy, islet transplant, closed-loop insulin delivery, immunotherapy
Sources: ClinicalTrials.gov, Crunchbase, news, company websites

**Clinical pipeline** *(if applicable — skip if not a clinical-stage company or indication)*
Search ClinicalTrials.gov for active and completed trials in this indication:
- Trial ID (NCT number), sponsor, phase, primary endpoint, status, enrollment
Sources: clinicaltrials.gov — link each trial directly

**Scientific foundation**
Key studies that validate or challenge the approach:
- Supporting studies: mechanism validation, proof-of-concept
- Cautionary or conflicting findings
Sources: PubMed — cite PMID and direct link for every study

**Regulatory landscape**
- Precedent approvals or clearances in this space
- Relevant FDA/EMA guidance documents
- Any regulatory risk specific to this modality
Sources: FDA.gov, EMA.europa.eu, news

**Funding activity (last 24 months)**
Rounds, partnerships, acquisitions across the space — not just the target company:
- Company, round size, date, lead investors, strategic rationale
Sources: Crunchbase, TechCrunch, press releases — link each

**Key risks**
- Scientific, clinical, regulatory, competitive, or commercial risks stated factually
- No softening, no editorializing

**Open questions for diligence**
- Specific unanswered factual questions that would materially change the investment view

Rules:
- Bullet points only — no prose paragraphs
- Direct link on every source — no bare citations
- No subjective assessment, opinion, or qualitative judgment
- Do not fabricate trial IDs, funding rounds, or study results
- Unverified: *(Unverified)* | Inferred: *(Inference)* | Company-claimed: *(Claimed)* | Conflicting: *(Conflicting)*
- For PubMed: always include PMID and direct link https://pubmed.ncbi.nlm.nih.gov/[PMID]
- For ClinicalTrials: always include NCT number and direct link https://clinicaltrials.gov/study/[NCT]`
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
