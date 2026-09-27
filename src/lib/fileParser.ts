export interface ParsedData {
  headers: string[];
  rows: Record<string, number>[];
  filename: string;
}

function detectDelimiter(line: string): string {
  const tab = (line.match(/\t/g) || []).length;
  const comma = (line.match(/,/g) || []).length;
  if (tab > 0 && tab >= comma) return '\t';
  if (comma > 0) return ',';
  return /\s+/.source;
}

export function parseFile(content: string, filename: string): ParsedData {
  const lines = content.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 6) throw new Error('File must have at least 5 data rows plus a header row.');

  const delimiter = detectDelimiter(lines[0]);
  const isRegex = delimiter === /\s+/.source;

  const headers = isRegex
    ? lines[0].trim().split(/\s+/)
    : lines[0].trim().split(delimiter).map(h => h.trim());

  if (headers.length < 2) throw new Error('File must have at least 2 columns.');

  const rows: Record<string, number>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = isRegex
      ? lines[i].trim().split(/\s+/)
      : lines[i].trim().split(delimiter).map(v => v.trim());
    if (parts.length < headers.length) continue;
    const row: Record<string, number> = {};
    for (let j = 0; j < headers.length; j++) {
      const val = parseFloat(parts[j]);
      row[headers[j]] = isNaN(val) ? 0 : val;
    }
    rows.push(row);
  }

  if (rows.length < 5) throw new Error('File must have at least 5 valid data rows.');
  return { headers, rows, filename };
}