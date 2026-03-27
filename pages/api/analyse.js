import Anthropic from "@anthropic-ai/sdk";

const PROFILE = `
## PROFESSIONAL_SNAPSHOT
Name: Nitya Samavedam
Current role: Associate Product Manager at Kriyadocs (April 2025 - Present)
Experience: ~1.5 years in product, CS + ML background
Promoted from BA to APM within 10 months

Core strengths:
- 0-to-1 product development and MVP ownership
- LLM pipeline design and AI feature specification
- Revenue-tied roadmap decisions ($3M+ enterprise pipeline)
- Technical credibility: API architecture, GPT pipelines, ClickHouse analytics

## SKILLS_INVENTORY
AI & ML: LLM product development, GPT pipeline design, prompt engineering,
NLP, predictive modelling, AI feature specification, model evaluation
Product: 0-to-1 MVP, roadmap planning, PRD/CRD writing, agile/scrum,
user interviews, competitive analysis, go-to-market strategy
Technical: REST API integration, system architecture, ClickHouse DB,
ElasticSearch, SQL, Python, Java, JSON, MySQL
Tools: JIRA, Confluence, Figma, Tableau, PowerBI

## NOTABLE_ACHIEVEMENTS
- Launched 0-to-1 Researcher Dashboard MVP → 90% drop in author queries in 3 months
- Led 8 RFP demos + 6 sandboxes → 4 enterprise acquisitions → $266K new ARR
- Advanced $3M+ enterprise pipeline via tailored POCs
- Reduced defect recurrence by 80% via root-cause architecture work
- API marketplace strategy (5 vendors) → projected $100K incremental ARR
- GPT-integrated Python pipelines → saved 48 hrs/project, $1M annual cost reduction
- Supported $3.5M in final contract conversions (Mad Street Den)
- Promoted from BA to APM within 10 months

## RESUME_VERSIONS
- AI PM: LLM pipelines, AI feature spec, model evaluation, GPT automation
- Revenue PM: ARR growth, enterprise pipeline, RFP demos, stakeholder management
- Technical PM: API architecture, system design, engineering partnership

## JOB_PREFERENCES
Target roles: AI PM, Associate PM, Technical PM
Target companies: Series A-C AI startups, B2B SaaS, developer tools
Location: Bangalore / Remote India / Remote global
Experience level: 0-2 years PM roles
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { jobDescription, company, role } = req.body;

  if (!jobDescription || jobDescription.trim().length < 50) {
    return res.status(400).json({ error: "Please paste a full job description (at least 50 characters)." });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `You are a job fit analyser. Analyse this job description against the candidate profile.
Return ONLY valid JSON — no markdown, no explanation:

{
  "score": <integer 0-100>,
  "verdict": "<strong_fit|possible|weak_fit|skip>",
  "resume_version": "<AI PM|Revenue PM|Technical PM>",
  "one_line": "<one sentence on overall fit>",
  "top_matches": ["<match 1>", "<match 2>", "<match 3>"],
  "gaps": ["<gap 1>", "<gap 2>"],
  "tailored_bullets": [
    "<bullet 1 — rewritten to mirror JD language, with exact numbers>",
    "<bullet 2>",
    "<bullet 3>",
    "<bullet 4>",
    "<bullet 5>"
  ]
}

Scoring guide:
80-100: Strong fit — skills, seniority, industry align
65-79: Possible — strong overlap, some gaps
40-64: Weak fit
0-39: Skip

For tailored_bullets: rewrite Nitya's actual achievements to mirror the JD's exact keywords.
NEVER invent metrics — only use numbers from the profile.
Keep each bullet under 20 words. Lead with a strong action verb.

CANDIDATE PROFILE:
${PROFILE}

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

Company: ${company || "Not specified"}
Role: ${role || "Not specified"}`
      }]
    });

    const text = response.content[0].text.trim();
    let result;

    try {
      result = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) result = JSON.parse(match[0]);
      else throw new Error("Could not parse Claude response");
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}