import { useState } from "react";
import Head from "next/head";

const SAMPLE_JD = `We are looking for an AI Product Manager to own our LLM-powered product roadmap. You will define AI feature specifications, run user research, partner with engineering to ship fast, and drive ARR growth. Experience with B2B SaaS, 0-to-1 product development, and working with ML/AI teams is highly valued. 1-3 years of product management experience preferred.`;

export default function Home() {
  const [jd, setJd]           = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole]       = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [resumeFile, setResumeFile]   = useState(null);
  const [resumeName, setResumeName]   = useState("");
  const [resumeError, setResumeError] = useState("");

  const scoreColors = {
    strong_fit: { bg: "#E1F5EE", text: "#08bc38a1", label: "Strong fit" },
    possible:   { bg: "#FAEEDA", text: "#854F0B", label: "Possible fit" },
    weak_fit:   { bg: "#FAECE7", text: "#993C1D", label: "Weak fit" },
    skip:       { bg: "#F1EFE8", text: "#5F5E5A", label: "Not a fit" },
  };

  async function analyse() {
    if (!jd.trim()) { setError("Please paste a job description first."); return; }
    if (!resumeFile) { setError("Please upload a resume first."); return; }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("resume", resumeFile);
      form.append("jobDescription", jd);
      form.append("company", company);
      form.append("role", role);

      const res  = await fetch("/api/analyse", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function loadSample() {
    setJd(SAMPLE_JD);
    setCompany("Sarvam AI");
    setRole("AI Product Manager");
    setResult(null);
    setError("");
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (!allowed.includes(file.type)) {
      setResumeError("Only .pdf or .docx files are supported.");
      setResumeFile(null);
      setResumeName("");
      return;
    }
    setResumeError("");
    setResumeFile(file);
    setResumeName(file.name);
  }

  const colors = result ? (scoreColors[result.verdict] || scoreColors.possible) : null;

  return (
    <>
      <Head>
        <title>AI Job Search Agent</title>
        <meta name="description" content="AI-powered job fit analyser" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ minHeight: "100vh", background: "#000", fontFamily: "Arial, sans-serif" }}>

        {/* Header */}
        <div style={{ background: "#000", padding: "20px 24px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ color: "#fbfbfc", margin: 0, fontSize: 20, fontWeight: 600, textAlign: "center" }}>AI Job Search Agent</h1>
            </div>
            <a href="https://linkedin.com/in/nityasamavedam" target="_blank" rel="noreferrer"
              style={{ color: "#fefefe", fontSize: 13, fontWeight: 200, textDecoration: "none", border: "1px solid #2c22f6", padding: "6px 12px", borderRadius: 6, background: "#072e6d"}}>
              LinkedIn
            </a>
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>

          {/* Intro card */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", marginBottom: 20, border: "0.5px solid #D3D1C7" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 16, color: "#1A1A1A" }}>How this works:</h2>
            <p style={{ margin: "0 0 12px", fontSize: 14, color: "#5F5E5A", lineHeight: 1.6 }}>
              Upload any resume and paste a job description. Claude will score the fit, identify skill matches and gaps, and generate tailored resume bullets in real time.
            </p>
            <button onClick={loadSample} style={{ background: "#E1F5EE", color: "#0F6E56", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
              Click here to load sample JD
            </button>
          </div>

          {/* Input */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", marginBottom: 16, border: "0.5px solid #D3D1C7" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "#5F5E5A", display: "block", marginBottom: 4 }}>Company (optional)</label>
                <input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Sarvam AI"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #B4B2A9", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "#5F5E5A", display: "block", marginBottom: 4 }}>Role title (optional)</label>
                <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. AI Product Manager"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #B4B2A9", fontSize: 13, boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Resume upload */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#5F5E5A", display: "block", marginBottom: 4 }}>
                Resume* (.pdf or .docx)
              </label>
              <label style={{
                display: "inline-block", cursor: "pointer",
                background: "#F1EFE8", border: "0.5px solid #B4B2A9",
                borderRadius: 6, padding: "7px 14px",
                fontSize: 12, color: "#1A1A1A", fontWeight: 500
              }}>
                Choose file
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </label>
              {resumeName && (
                <span style={{ marginLeft: 10, fontSize: 12, color: "#0F6E56", fontWeight: 500 }}>
                  {resumeName}
                </span>
              )}
              {resumeError && (
                <p style={{ color: "#A32D2D", fontSize: 13, margin: "6px 0 0" }}>
                  {resumeError}
                </p>
              )}
            </div>

            <label style={{ fontSize: 12, fontWeight: 500, color: "#5F5E5A", display: "block", marginBottom: 4 }}>Job description*</label>
            <textarea value={jd} onChange={e => setJd(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={7}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "0.5px solid #B4B2A9", fontSize: 13, lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", fontFamily: "Arial" }} />

            {error && <p style={{ color: "#A32D2D", fontSize: 13, margin: "8px 0 0" }}>{error}</p>}

            <button onClick={analyse} disabled={loading}
              style={{ marginTop: 12, width: "100%", background: loading ? "#B4B2A9" : "#0F6E56", color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Claude is analysing..." : "Analyse this role"}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #D3D1C7", overflow: "hidden" }}>

              {/* Score banner */}
              <div style={{ background: colors.bg, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ fontSize: 48, fontWeight: 700, color: colors.text, lineHeight: 1 }}>{result.score}</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>{colors.label}</div>
                  <div style={{ fontSize: 13, color: "#5F5E5A", marginTop: 2 }}>Use <strong>{result.resume_version}</strong> resume version</div>
                  <div style={{ fontSize: 13, color: "#5F5E5A", marginTop: 2 }}>{result.one_line}</div>
                </div>
              </div>

              <div style={{ padding: "20px 24px" }}>

                {/* Matches + Gaps */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#5F5E5A", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Skill matches</p>
                    {result.top_matches?.map((m, i) => (
                      <div key={i} style={{ background: "#E1F5EE", color: "#085041", fontSize: 12, padding: "4px 10px", borderRadius: 4, marginBottom: 4 }}>{m}</div>
                    ))}
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#5F5E5A", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Gaps</p>
                    {result.gaps?.map((g, i) => (
                      <div key={i} style={{ background: "#FAECE7", color: "#712B13", fontSize: 12, padding: "4px 10px", borderRadius: 4, marginBottom: 4 }}>{g}</div>
                    ))}
                  </div>
                </div>

                {/* Bullets */}
                <div style={{ borderTop: "0.5px solid #D3D1C7", paddingTop: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#5F5E5A", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>
                    Tailored resume bullets
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {result.tailored_bullets?.map((b, i) => (
                      <li key={i} style={{ fontSize: 13, color: "#1A1A1A", lineHeight: 1.7, marginBottom: 6 }}>{b}</li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Footer */}
              <div style={{ background: "#F1EFE8", padding: "12px 24px", borderTop: "0.5px solid #D3D1C7" }}>
                <p style={{ margin: 0, fontSize: 12, color: "#888780" }}>
                  Built by Nitya Samavedam · Agentic AI pipeline · Python + Claude API + Google Sheets ·&nbsp;
                  <a href="https://github.com/nityasamavedam" style={{ color: "#0F6E56" }}>GitHub</a>
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
