import { ParsedRawTransaction } from "./types";

/**
 * Parses raw CSV/TSV content into rows and columns, handling quotes and escapes.
 */
export function parseDelimitedText(content: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  // Determine delimiter: detect commas vs tabs vs semicolons
  const sample = content.slice(0, 2000);
  const tabCount = (sample.match(/\t/g) || []).length;
  const semicolonCount = (sample.match(/;/g) || []).length;
  const commaCount = (sample.match(/,/g) || []).length;

  let delimiter = ",";
  if (tabCount > commaCount && tabCount > semicolonCount) delimiter = "\t";
  else if (semicolonCount > commaCount) delimiter = ";";

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((char === "\r" || char === "\n") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") i++; // handle CRLF
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      lines.push(currentRow);
    }
  }

  return lines;
}

/**
 * Searches for table header row in CSV containing standard financial column keywords.
 */
export function findHeaderRowIndex(rows: string[][]): {
  headerIndex: number;
  headers: string[];
  columns: {
    dateIdx: number;
    descIdx: number;
    debitIdx: number;
    creditIdx: number;
    amountIdx: number;
    typeIdx: number;
    refIdx: number;
    balanceIdx: number;
    valueDateIdx: number;
  };
} | null {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i].map(c => c.toLowerCase().trim());

    const dateIdx = row.findIndex(c => 
      c.includes("date") || c === "txn date" || c === "trans date" || c === "transaction date" || c === "value dt"
    );
    const descIdx = row.findIndex(c => 
      c.includes("description") || c.includes("narration") || c.includes("particular") || 
      c.includes("details") || c.includes("remarks") || c.includes("merchant") || c === "payee"
    );

    // Look for debit/credit or amount
    const debitIdx = row.findIndex(c => 
      c.includes("debit") || c.includes("withdrawal") || /\bdr\b/i.test(c)
    );
    const creditIdx = row.findIndex(c => 
      c.includes("credit") || c.includes("deposit") || /\bcr\b/i.test(c)
    );
    const amountIdx = row.findIndex(c => 
      (c.includes("amount") || c === "total" || c === "amt") && !c.includes("debit") && !c.includes("credit")
    );

    // If we have date + description + either (debit/credit) or amount, we found the table header!
    if (dateIdx !== -1 && (descIdx !== -1 || row.length >= 3) && (debitIdx !== -1 || creditIdx !== -1 || amountIdx !== -1)) {
      const typeIdx = row.findIndex(c => c.includes("type") || c === "direction");
      const refIdx = row.findIndex(c => 
        c.includes("ref") || c.includes("utr") || c.includes("chq") || c.includes("cheque") || 
        c.includes("transaction id") || c.includes("order id") || c.includes("txn id")
      );
      const balanceIdx = row.findIndex(c => c.includes("balance"));
      const valueDateIdx = row.findIndex(c => c.includes("value date") || c.includes("value dt"));

      return {
        headerIndex: i,
        headers: rows[i],
        columns: {
          dateIdx,
          descIdx: descIdx !== -1 ? descIdx : (dateIdx === 0 ? 1 : 0),
          debitIdx,
          creditIdx,
          amountIdx,
          typeIdx,
          refIdx,
          balanceIdx,
          valueDateIdx
        }
      };
    }
  }

  return null;
}

/**
 * Parse monetary string like "₹ 1,499.50", "2499.00", "1,200.00 DR", "(500.00)"
 */
export function parseNumericAmount(val: string | undefined): number | null {
  if (!val) return null;
  const clean = val.replace(/₹|\$|€|£|INR|USD|EUR|GBP/gi, "")
                   .replace(/,/g, "")
                   .trim();
  if (!clean || clean === "-" || clean === "NA") return null;

  // Check parenthesized negative e.g. (100.00)
  const parenMatch = clean.match(/^\(([0-9.]+)\)$/);
  if (parenMatch) {
    const num = parseFloat(parenMatch[1]);
    return isNaN(num) ? null : -num;
  }

  const isDr = /cr\b/i.test(clean) ? false : /dr\b/i.test(clean);
  const rawNumStr = clean.replace(/[a-zA-Z]/g, "").trim();
  const num = parseFloat(rawNumStr);
  if (isNaN(num)) return null;

  return isDr ? -Math.abs(num) : num;
}
