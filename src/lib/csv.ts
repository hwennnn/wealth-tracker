import { Category, Entry } from "./types";

export function exportEntriesToCSV(
  entries: Entry[],
  categories: Category[]
): string {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const headers = ["Date", "Category", "Amount", "Currency", "Notes"];
  const rows = entries.map((e) => [
    new Date(e.date).toISOString().split("T")[0],
    categoryMap.get(e.category_id) || "Unknown",
    e.amount.toString(),
    e.currency,
    (e.notes || "").replace(/"/g, '""'),
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((r) => r.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csv;
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type ParsedCSVRow = {
  date: string;
  category: string;
  amount: number;
  currency: string;
  notes: string;
};

export function parseCSV(text: string): ParsedCSVRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  // Skip header
  const dataLines = lines.slice(1);
  const results: ParsedCSVRow[] = [];

  for (const line of dataLines) {
    const cells = parseCSVLine(line);
    if (cells.length < 4) continue;

    const amount = parseFloat(cells[2]);
    if (isNaN(amount)) continue;

    results.push({
      date: cells[0],
      category: cells[1],
      amount,
      currency: cells[3] || "SGD",
      notes: cells[4] || "",
    });
  }

  return results;
}

function parseCSVLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}
