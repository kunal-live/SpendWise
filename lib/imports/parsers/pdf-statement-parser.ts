import { ParsedRawTransaction, ParsedStatementResult } from "./types";
import { extractTextFromPdfBuffer } from "@/lib/bills/document-extractor/pdf-extractor";
import { parseNumericAmount } from "./csv-parser";

export class PdfStatementParser {
  canParse(filename: string): boolean {
    return filename.toLowerCase().endsWith(".pdf");
  }

  async parse(filename: string, buffer: Buffer): Promise<ParsedStatementResult> {
    const rawResult = await extractTextFromPdfBuffer(buffer);
    const fullText = rawResult.raw_text;
    const lower = fullText.toLowerCase();

    let sourceName = "Bank Statement (PDF)";
    if (lower.includes("hdfc")) sourceName = "HDFC Bank";
    else if (lower.includes("icici")) sourceName = "ICICI Bank";
    else if (lower.includes("sbi") || lower.includes("state bank")) sourceName = "SBI";
    else if (lower.includes("axis")) sourceName = "Axis Bank";
    else if (lower.includes("google pay") || lower.includes("gpay")) sourceName = "Google Pay";
    else if (lower.includes("phonepe")) sourceName = "PhonePe";
    else if (lower.includes("paytm")) sourceName = "Paytm";

    let accountIdentifier: string | undefined;
    const acctMatch = fullText.match(/account(?:\s*no\.?|\s*number)?[:\s]+[xX*]*([0-9]{4,})/i);
    if (acctMatch) {
      accountIdentifier = `XXXX${acctMatch[1].slice(-4)}`;
    }

    const lines = rawResult.lines.map(l => l.text.trim()).filter(l => l.length > 0);
    const transactions: ParsedRawTransaction[] = [];

    // Date regexes:
    // 01/09/2026, 01-09-2026, 2026-09-01, 01 Sep 2026, 01-SEP-2026
    const dateRegex = /^(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}[-\s][A-Za-z]{3}[-\s]\d{2,4})\b/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const dateMatch = line.match(dateRegex);
      if (!dateMatch) continue;

      const dateStr = dateMatch[1];
      const remainder = line.slice(dateMatch[0].length).trim();
      if (!remainder) continue;

      // Extract trailing amounts: e.g. "542.00 24580.00" or "2499.00" or "50000.00 CR 72081.00"
      const numberMatches = Array.from(remainder.matchAll(/(?:₹|\$)?\s*([0-9,]+\.[0-9]{2}|[0-9,]{3,})(?:\s*(?:CR|DR))?/gi));
      if (numberMatches.length === 0) continue;

      let debit: number | undefined;
      let credit: number | undefined;
      let balance: number | undefined;

      const lastMatch = numberMatches[numberMatches.length - 1];
      const secondLastMatch = numberMatches.length >= 2 ? numberMatches[numberMatches.length - 2] : null;

      // Determine description: everything before the first monetary number
      const firstNumIndex = remainder.indexOf(numberMatches[0][0]);
      let description = (firstNumIndex > 0 ? remainder.slice(0, firstNumIndex) : remainder).trim();

      // Check if next line is continuation of description
      if (i + 1 < lines.length && !lines[i + 1].match(dateRegex) && lines[i + 1].length < 60) {
        const nextL = lines[i + 1];
        if (!nextL.match(/^[0-9,.]+(?:\s*(?:CR|DR))?$/i) && !nextL.toLowerCase().includes("page")) {
          description += " " + nextL;
          i++; // consumed continuation line
        }
      }

      if (numberMatches.length >= 2 && secondLastMatch) {
        // We have [Amount, Balance] or [Debit, Credit, Balance]
        const rawAmt = parseNumericAmount(secondLastMatch[0]);
        balance = parseNumericAmount(lastMatch[0]) ?? undefined;

        if (rawAmt !== null) {
          const isCredit = /credit|cr\b|deposit|salary|refund/i.test(remainder);
          if (isCredit) {
            credit = Math.abs(rawAmt);
          } else {
            debit = Math.abs(rawAmt);
          }
        }
      } else {
        // Single amount
        const rawAmt = parseNumericAmount(lastMatch[0]);
        if (rawAmt !== null) {
          const isCredit = /credit|cr\b|deposit|salary|refund/i.test(remainder);
          if (isCredit) {
            credit = Math.abs(rawAmt);
          } else {
            debit = Math.abs(rawAmt);
          }
        }
      }

      if (debit === undefined && credit === undefined) continue;

      // Check for reference ID (UTR / Chq)
      let reference: string | undefined;
      const refMatch = description.match(/(?:UPI|UTR|REF|CHQ|IMPS|NEFT)[\s/:-]*([A-Za-z0-9]{8,})/i);
      if (refMatch) {
        reference = refMatch[1];
      }

      transactions.push({
        date: dateStr,
        description: description.replace(/\s{2,}/g, " ").trim(),
        debit,
        credit,
        amount: debit !== undefined ? debit : credit,
        reference,
        balance,
        rawData: { originalLine: line }
      });
    }

    return {
      sourceType: sourceName.includes("Pay") ? "payment_app" : "bank_statement",
      sourceName,
      accountIdentifier,
      transactions,
      metadata: {
        totalRowsParsed: transactions.length,
        pageCount: rawResult.page_count
      }
    };
  }
}

export const pdfStatementParser = new PdfStatementParser();
