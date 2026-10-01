import { ParsedRawTransaction, ParsedStatementResult } from "./types";
import { parseDelimitedText, findHeaderRowIndex, parseNumericAmount } from "./csv-parser";

export class BankStatementParser {
  canParse(filename: string, content: string): boolean {
    const lower = (filename + " " + content.slice(0, 1500)).toLowerCase();
    return (
      lower.includes("hdfc") ||
      lower.includes("icici") ||
      lower.includes("sbi") ||
      lower.includes("state bank") ||
      lower.includes("axis") ||
      lower.includes("statement") ||
      lower.includes("withdrawal") ||
      lower.includes("deposit") ||
      lower.includes("narration") ||
      lower.includes("closing balance")
    );
  }

  parse(filename: string, content: string): ParsedStatementResult {
    const lower = (filename + " " + content.slice(0, 1500)).toLowerCase();
    let sourceName = "Bank Statement";
    if (lower.includes("hdfc")) sourceName = "HDFC Bank";
    else if (lower.includes("icici")) sourceName = "ICICI Bank";
    else if (lower.includes("sbi") || lower.includes("state bank")) sourceName = "SBI";
    else if (lower.includes("axis")) sourceName = "Axis Bank";
    else if (lower.includes("kotak")) sourceName = "Kotak Bank";

    // Extract masked account number if mentioned in top metadata (e.g., "Account No: ...5678")
    let accountIdentifier: string | undefined;
    const acctMatch = content.match(/account(?:\s*no\.?|\s*number)?[:\s]+[xX*]*([0-9]{4,})/i);
    if (acctMatch) {
      accountIdentifier = `XXXX${acctMatch[1].slice(-4)}`;
    }

    const rows = parseDelimitedText(content);
    if (rows.length === 0) {
      return { sourceType: "bank_statement", sourceName, transactions: [] };
    }

    const headerInfo = findHeaderRowIndex(rows);
    if (!headerInfo) {
      return {
        sourceType: "bank_statement",
        sourceName,
        accountIdentifier,
        transactions: []
      };
    }

    const { headerIndex, columns } = headerInfo;
    const dataRows = rows.slice(headerIndex + 1);
    const transactions: ParsedRawTransaction[] = [];

    for (const row of dataRows) {
      if (row.length < 2) continue;

      const dateStr = columns.dateIdx >= 0 ? row[columns.dateIdx] : "";
      const descStr = columns.descIdx >= 0 ? row[columns.descIdx] : "";

      // Ignore empty or summary rows
      if (!dateStr || !descStr) continue;
      const lowerDesc = descStr.toLowerCase();
      if (
        lowerDesc.includes("opening balance") ||
        lowerDesc.includes("closing balance") ||
        lowerDesc.includes("statement summary") ||
        lowerDesc.includes("page total")
      ) {
        continue;
      }

      let debit: number | undefined;
      let credit: number | undefined;

      if (columns.debitIdx >= 0) {
        const d = parseNumericAmount(row[columns.debitIdx]);
        if (d !== null && d > 0) debit = d;
      }

      if (columns.creditIdx >= 0) {
        const c = parseNumericAmount(row[columns.creditIdx]);
        if (c !== null && c > 0) credit = c;
      }

      // Handle single amount column with Dr/Cr sign or Type indicator
      if (debit === undefined && credit === undefined && columns.amountIdx >= 0) {
        const a = parseNumericAmount(row[columns.amountIdx]);
        if (a !== null) {
          const typeStr = columns.typeIdx >= 0 ? (row[columns.typeIdx] || "").toLowerCase() : "";
          if (a < 0 || typeStr.includes("dr") || typeStr.includes("debit")) {
            debit = Math.abs(a);
          } else {
            credit = Math.abs(a);
          }
        }
      }

      // If neither debit nor credit could be found, skip
      if (debit === undefined && credit === undefined) continue;

      const reference = columns.refIdx >= 0 ? row[columns.refIdx] : undefined;
      const valueDate = columns.valueDateIdx >= 0 ? row[columns.valueDateIdx] : undefined;
      const balance = columns.balanceIdx >= 0 ? parseNumericAmount(row[columns.balanceIdx]) ?? undefined : undefined;

      transactions.push({
        date: dateStr,
        description: descStr,
        debit,
        credit,
        amount: debit !== undefined ? debit : credit,
        reference: reference && reference.trim().length > 0 ? reference.trim() : undefined,
        valueDate: valueDate && valueDate.trim().length > 0 ? valueDate.trim() : undefined,
        balance,
        rawData: { row }
      });
    }

    return {
      sourceType: "bank_statement",
      sourceName,
      accountIdentifier,
      transactions,
      metadata: { totalRowsParsed: transactions.length }
    };
  }
}

export const bankStatementParser = new BankStatementParser();
