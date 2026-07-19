import type { ReportData } from "./data";

/** RFC 4180-ish escaping — quote a value only if it contains a comma, quote, or newline. No
 * library needed for something this small. */
function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function findingsToCsv(findings: ReportData["audit"]["findings"]): string {
  const header = ["Page", "Engine", "Category", "Severity", "Confidence", "Title", "Status", "Created At"];
  const rows = findings.map((f) =>
    [
      f.page.url,
      f.engine,
      f.category ?? "",
      f.severity,
      `${Math.round(f.confidence * 100)}%`,
      f.title,
      f.status,
      f.createdAt.toISOString(),
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );
  return [header.join(","), ...rows].join("\n");
}
