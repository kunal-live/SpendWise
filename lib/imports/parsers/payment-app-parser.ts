import { ParsedRawTransaction, ParsedStatementResult } from "./types";
import { parseDelimitedText, findHeaderRowIndex, parseNumericAmount } from "./csv-parser";

export class PaymentAppParser {
  canParse(filename: string, content: string): boolean {
    const lower = (filename + " " + content.slice(0, 1000)).toLowerCase();
    return (
      lower.includes("google pay") ||
      lower.includes("gpay") ||
      lower.includes("phonepe") ||
      lower.includes("paytm") ||
      lower.includes("upi transaction")
    );
  }

  parse(filename: string, content: string): ParsedStatementResult {
    const lower = (filename + " " + content.slice(0, 1000)).toLowerCase();
    let sourceName = "Payment App";
    if (lower.includes("google pay") || lower.includes("gpay")) sourceName = "Google Pay";
    else if (lower.includes("phonepe")) sourceName = "PhonePe";
    else if (lower.includes("paytm")) sourceName = "Paytm";

    const rows = parseDelimitedText(content);
    if (rows.length === 0) {
      return { sourceType: "payment_app", sourceName, transactions: [] };
    }

    const headerInfo = findHeaderRowIndex(rows);
    if (!headerInfo) {
      // Try naive fallback: row 0 is header
      return this.parseGenericPaymentRows(rows, sourceName);
    }

    const { headerIndex, columns } = headerInfo;
    const dataRows = rows.slice(headerIndex + 1);
    const transactions: ParsedRawTransaction[] = [];

    for (const row of dataRows) {
      if (row.length < 2) continue;

      const dateStr = columns.dateIdx >= 0 ? row[columns.dateIdx] : "";
      const descStr = columns.descIdx >= 0 ? row[columns.descIdx] : "";
      if (!dateStr || !descStr) continue;

      // Skip non-transaction rows (e.g. totals or notes)
      if (descStr.toLowerCase().includes("total") && !row[columns.dateIdx]) continue;

      let debit: number | undefined;
      let credit: number | undefined;
      let amount: number | undefined;

      if (columns.debitIdx >= 0 && columns.creditIdx >= 0) {
        const d = parseNumericAmount(row[columns.debitIdx]);
        const c = parseNumericAmount(row[columns.creditIdx]);
        if (d !== null && d > 0) debit = d;
        if (c !== null && c > 0) credit = c;
      }

      if (debit === undefined && credit === undefined && columns.amountIdx >= 0) {
        const a = parseNumericAmount(row[columns.amountIdx]);
        if (a !== null) {
          const typeStr = columns.typeIdx >= 0 ? (row[columns.typeIdx] || "").toLowerCase() : "";
          if (typeStr.includes("cr") || typeStr.includes("credit") || typeStr.includes("received")) {
            credit = Math.abs(a);
          } else {
            debit = Math.abs(a);
          }
          amount = Math.abs(a);
        }
      }

      const reference = columns.refIdx >= 0 ? row[columns.refIdx] : undefined;
      const rawType = columns.typeIdx >= 0 ? row[columns.typeIdx] : undefined;

      transactions.push({
        date: dateStr,
        description: descStr,
        amount: amount || (debit ? debit : credit),
        debit,
        credit,
        reference,
        rawType,
        rawData: { row }
      });
    }

    return {
      sourceType: "payment_app",
      sourceName,
      transactions,
      metadata: { totalRowsParsed: transactions.length }
    };
  }

  private parseGenericPaymentRows(rows: string[][], sourceName: string): ParsedStatementResult {
    const transactions: ParsedRawTransaction[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 3) continue;
      const date = row[0];
      const desc = row[1];
      const amt = parseNumericAmount(row[2]);
      if (date && desc && amt !== null) {
        transactions.push({
          date,
          description: desc,
          amount: Math.abs(amt),
          debit: amt < 0 ? Math.abs(amt) : Math.abs(amt),
          rawData: { row }
        });
      }
    }
    return {
      sourceType: "payment_app",
      sourceName,
      transactions
    };
  }
}

export const paymentAppParser = new PaymentAppParser();
