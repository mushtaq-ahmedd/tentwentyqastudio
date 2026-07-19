import type { ReportData } from "./data";

/**
 * Plain HTML string templates, not JSX — this runs in a Node/Playwright context generating a
 * document to print to PDF, not a React tree. Every dynamic value is escaped: findings' text
 * fields ultimately originate from real scraped web page content (docs/03's engines), so
 * unescaped `<`/`&` could both break this document's structure and — however unlikely in a
 * headless, single-use render — inject markup.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function severityBadge(severity: string): string {
  return `<span class="badge badge-${severity.toLowerCase()}">${escapeHtml(severity)}</span>`;
}

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 32px 40px; font-size: 13px; line-height: 1.5; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 28px 0 10px; border-bottom: 1px solid #e2e2e2; padding-bottom: 6px; }
  .meta { color: #666; font-size: 12px; margin-bottom: 24px; }
  .stat-grid { display: flex; gap: 16px; margin-bottom: 8px; }
  .stat { border: 1px solid #e2e2e2; border-radius: 8px; padding: 12px 16px; flex: 1; }
  .stat .value { font-size: 20px; font-weight: 700; }
  .stat .label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: .04em; }
  .finding { border: 1px solid #e2e2e2; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px; page-break-inside: avoid; }
  .finding h3 { margin: 0 0 6px; font-size: 14px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #fff; }
  .badge-critical { background: #b91c1c; }
  .badge-high { background: #c2410c; }
  .badge-medium { background: #a16207; }
  .badge-low { background: #4b5563; }
  .field-label { font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: #666; margin-top: 8px; }
  .screenshot { max-width: 100%; border: 1px solid #e2e2e2; border-radius: 6px; margin-top: 8px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 12px; }
  th { color: #666; font-weight: 600; text-transform: uppercase; font-size: 10px; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

function metaLine(data: ReportData): string {
  const { audit } = data;
  return `<div class="meta">${escapeHtml(audit.project.name)} — ${escapeHtml(audit.environment.name)} — Audit #${audit.runNumber} — ${audit.startedAt.toISOString()}</div>`;
}

/** Full detail, every field, embedded screenshots where available — the persona this serves
 * (docs/02) needs to act on a finding without asking QA for clarification. */
export function developerReportHtml(data: ReportData, screenshots: Map<string, string>): string {
  const { audit } = data;
  const body = `
    <h1>Developer Report</h1>
    ${metaLine(data)}
    <h2>Findings (${audit.findings.length})</h2>
    ${audit.findings
      .map(
        (f) => `
      <div class="finding">
        <h3>${severityBadge(f.severity)} ${escapeHtml(f.title)}</h3>
        <div>Page: ${escapeHtml(f.page.url)} · Engine: ${escapeHtml(f.engine)} · Confidence: ${Math.round(f.confidence * 100)}%</div>
        <div class="field-label">Description</div><div>${escapeHtml(f.description)}</div>
        <div class="field-label">Expected Result</div><div>${escapeHtml(f.expectedResult)}</div>
        <div class="field-label">Actual Result</div><div>${escapeHtml(f.actualResult)}</div>
        <div class="field-label">Business Impact</div><div>${escapeHtml(f.businessImpact)}</div>
        <div class="field-label">Suggested Resolution</div><div>${escapeHtml(f.suggestedResolution)}</div>
        ${f.aiExplanation ? `<div class="field-label">AI Explanation</div><div>${escapeHtml(f.aiExplanation)}</div>` : ""}
        ${screenshots.has(f.id) ? `<img class="screenshot" src="data:image/png;base64,${screenshots.get(f.id)}" alt="Screenshot evidence">` : ""}
      </div>`
      )
      .join("")}
    ${audit.findings.length === 0 ? "<p>No findings on this audit.</p>" : ""}
  `;
  return shell(`Developer Report — ${audit.project.name}`, body);
}

/** Summary stats + only Critical/High findings, no full technical detail — matches docs/02's
 * Engineering Manager persona: "high-level only... no implementation detail." */
export function managementReportHtml(data: ReportData): string {
  const { audit, findingsBySeverity, findingsByEngine, releaseReadiness } = data;
  const importantFindings = audit.findings.filter((f) => f.severity === "CRITICAL" || f.severity === "HIGH");

  const body = `
    <h1>Management Report</h1>
    ${metaLine(data)}
    <div class="stat-grid">
      <div class="stat"><div class="value">${audit.findings.length}</div><div class="label">Total Findings</div></div>
      <div class="stat"><div class="value">${findingsBySeverity.CRITICAL ?? 0}</div><div class="label">Critical</div></div>
      <div class="stat"><div class="value">${findingsBySeverity.HIGH ?? 0}</div><div class="label">High</div></div>
      <div class="stat"><div class="value">${releaseReadiness}</div><div class="label">Release Readiness</div></div>
    </div>
    <h2>Findings by Engine</h2>
    <table>
      <tr><th>Engine</th><th>Count</th></tr>
      ${Object.entries(findingsByEngine)
        .map(([engine, count]) => `<tr><td>${escapeHtml(engine)}</td><td>${count}</td></tr>`)
        .join("")}
    </table>
    <h2>Critical &amp; High Findings (${importantFindings.length})</h2>
    <table>
      <tr><th>Severity</th><th>Title</th><th>Page</th></tr>
      ${importantFindings
        .map((f) => `<tr><td>${severityBadge(f.severity)}</td><td>${escapeHtml(f.title)}</td><td>${escapeHtml(f.page.url)}</td></tr>`)
        .join("")}
    </table>
    ${importantFindings.length === 0 ? "<p>No Critical or High severity findings on this audit.</p>" : ""}
  `;
  return shell(`Management Report — ${audit.project.name}`, body);
}

/** No per-finding detail at all — matches docs/02's Product Manager persona: "executive summary,
 * major risks, release recommendation, overall progress — no technical detail." */
export function executiveReportHtml(data: ReportData): string {
  const { audit, releaseReadiness, criticalCount } = data;
  const body = `
    <h1>Executive Summary</h1>
    ${metaLine(data)}
    <div class="stat-grid">
      <div class="stat"><div class="value">${audit.findings.length}</div><div class="label">Total Findings</div></div>
      <div class="stat"><div class="value">${criticalCount}</div><div class="label">Critical Issues</div></div>
      <div class="stat"><div class="value">${releaseReadiness}</div><div class="label">Recommendation</div></div>
    </div>
    <h2>Summary</h2>
    <div>${
      audit.aiExecutiveSummary
        ? escapeHtml(audit.aiExecutiveSummary)
        : "No AI-generated summary is available for this audit (no AI provider was configured when it ran)."
    }</div>
  `;
  return shell(`Executive Summary — ${audit.project.name}`, body);
}
