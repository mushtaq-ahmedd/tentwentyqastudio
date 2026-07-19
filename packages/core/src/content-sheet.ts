/**
 * Content Sheet parsing (docs/04 Content Engine, Mode 1: "Content Sheet -> Website comparison").
 * docs/02/docs/04 name this mode but specify no file format, column schema, or matching rule — a
 * genuine spec gap, not something overlooked. This is the invented contract, kept deliberately
 * narrow: a CSV with three columns, one row per expected piece of copy.
 *
 * Required header row (case-insensitive, any column order): "Page", "Expected Text". "Element"
 * is optional — when present it's a human label (not read programmatically, just carried through
 * to findings for readability); when absent every row is checked against the whole page.
 *
 * "Page" is matched against a discovered page's URL by path only (docs gave no convention, and a
 * QA-authored spreadsheet is far more likely to contain a path like "/pricing" than a full origin
 * URL) — see `matchesPagePath`.
 */

export type ContentSheetRow = {
  page: string;
  element: string;
  expectedText: string;
};

export type ContentSheetParseResult = {
  rows: ContentSheetRow[];
  errors: string[];
};

const REQUIRED_COLUMNS = ["page", "expected text"] as const;

/** Splits one CSV line into fields, honoring double-quoted fields with embedded commas/quotes
 * ("" is an escaped quote) — RFC 4180's common subset, hand-written to avoid a dependency for
 * something this small (same choice already made for the Report Engine's CSV export). */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(field);
      field = "";
    } else {
      field += char;
    }
  }
  fields.push(field);
  return fields.map((f) => f.trim());
}

export function parseContentSheetCsv(csvText: string): ContentSheetParseResult {
  const lines = csvText.split(/\r\n|\r|\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { rows: [], errors: ["The file is empty."] };
  }

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const pageIdx = header.indexOf("page");
  const elementIdx = header.indexOf("element");
  const expectedIdx = header.indexOf("expected text");

  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [
        `Missing required column(s): ${missing.join(", ")}. Expected a header row containing "Page" and "Expected Text" (an optional "Element" column is also supported).`,
      ],
    };
  }

  const rows: ContentSheetRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = splitCsvLine(lines[i]);
    const page = fields[pageIdx]?.trim() ?? "";
    const expectedText = fields[expectedIdx]?.trim() ?? "";
    const element = elementIdx >= 0 ? (fields[elementIdx]?.trim() ?? "") : "";

    if (!page || !expectedText) {
      errors.push(`Row ${i + 1}: skipped — both "Page" and "Expected Text" are required.`);
      continue;
    }
    rows.push({ page, element, expectedText });
  }

  return { rows, errors };
}

/** Normalizes a row's "Page" value and a discovered page's real URL down to a comparable path,
 * so "/pricing", "pricing", and "https://example.com/pricing/" all match the same page. */
export function matchesPagePath(sheetPage: string, pageUrl: string): boolean {
  const normalize = (value: string): string => {
    let path: string;
    try {
      path = new URL(value).pathname;
    } catch {
      path = value;
    }
    path = path.trim().toLowerCase();
    if (!path.startsWith("/")) path = `/${path}`;
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    return path;
  };
  return normalize(sheetPage) === normalize(pageUrl);
}
