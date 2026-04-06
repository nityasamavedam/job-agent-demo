import Anthropic from "@anthropic-ai/sdk";

const formidable = require("formidable");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ maxFileSize: 5 * 1024 * 1024 }); // 5 MB cap
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

async function extractText(file) {
  const buffer = fs.readFileSync(file.filepath);
  const mime = file.mimetype || "";

  if (mime === "application/pdf") {
    const parsed = await pdfParse(buffer);
    return parsed.text.trim();
  }

  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  throw new Error("Unsupported file type. Please upload a .pdf or .docx file.");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let fields, files;
  try {
    ({ fields, files } = await parseForm(req));
  } catch {
    return res.status(400).json({ error: "Could not parse form data." });
  }

  // formidable v3 wraps field values in arrays
  const jobDescription = Array.isArray(fields.jobDescription) ? fields.jobDescription[0] : fields.jobDescription;
  const company = Array.isArray(fields.company) ? fields.company[0] : (fields.company || "");
  const role    = Array.isArray(fields.role)    ? fields.role[0]    : (fields.role    || "");

  if (!jobDescription || jobDescription.trim().length < 50) {
    return res.status(400).json({ error: "Please paste a full job description (at least 50 characters)." });
  }

  const resumeFile = Array.isArray(files.resume) ? files.resume[0] : files.resume;
  if (!resumeFile) {
    return res.status(400).json({ error: "Please upload a resume file." });
  }

  let resumeText;
  try {
    resumeText = await extractText(resumeFile);
  } catch (err) {
    return res.status(400).json({ error: err.message || "Failed to parse the resume file." });
  }

  if (!resumeText || resumeText.length < 50) {
    return res.status(400).json({ error: "Could not extract readable text from the resume. Try a different file." });
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

For tailored_bullets: rewrite the candidate's actual achievements to mirror the JD's exact keywords.
NEVER invent metrics — only use numbers from the profile.
Keep each bullet under 20 words. Lead with a strong action verb.

CANDIDATE PROFILE:
${resumeText.slice(0, 4000)}

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
