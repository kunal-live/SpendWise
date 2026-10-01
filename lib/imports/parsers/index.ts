import { ParsedStatementResult } from "./types";
import { bankStatementParser } from "./bank-statement-parser";
import { paymentAppParser } from "./payment-app-parser";
import { pdfStatementParser } from "./pdf-statement-parser";

export * from "./types";
export * from "./csv-parser";
export * from "./bank-statement-parser";
export * from "./payment-app-parser";
export * from "./pdf-statement-parser";

export async function parseStatementFile(
  filename: string,
  buffer: Buffer,
  preferredSource?: string
): Promise<ParsedStatementResult> {
  const ext = filename.toLowerCase().split(".").pop() || "";

  if (ext === "pdf") {
    const res = await pdfStatementParser.parse(filename, buffer);
    if (preferredSource && preferredSource !== "auto") {
      res.sourceName = preferredSource;
    }
    return res;
  }

  // Text/CSV/TSV
  const textContent = buffer.toString("utf-8");

  if (preferredSource && (preferredSource.includes("Pay") || preferredSource === "Google Pay" || preferredSource === "PhonePe" || preferredSource === "Paytm")) {
    const res = paymentAppParser.parse(filename, textContent);
    res.sourceName = preferredSource;
    return res;
  }

  if (paymentAppParser.canParse(filename, textContent)) {
    return paymentAppParser.parse(filename, textContent);
  }

  const bankRes = bankStatementParser.parse(filename, textContent);
  if (preferredSource && preferredSource !== "auto") {
    bankRes.sourceName = preferredSource;
  }
  return bankRes;
}
