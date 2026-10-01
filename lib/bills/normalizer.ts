import { BillItem, ExtractedBillData } from "@/lib/types";

export interface NormalizerOptions {
  fallbackDate?: string;
  defaultCurrency?: string;
}

/**
 * Normalizes raw OCR text into structured SpendWise bill data.
 */
export function normalizeBillText(
  rawText: string,
  options: NormalizerOptions = {}
): Omit<ExtractedBillData, "suggested_category" | "confidence" | "confidence_level" | "classification_reason"> {
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const missingFields: string[] = [];

  // 1. Merchant Extraction & Normalization
  const merchant = extractMerchant(lines, rawText);
  if (!merchant || merchant === "Unknown Merchant") {
    missingFields.push("merchant");
  }

  // 2. Invoice Number Extraction
  const invoiceNumber = extractInvoiceNumber(rawText);

  // 3. Date Extraction & Normalization to YYYY-MM-DD
  const transactionDate = extractDate(rawText) || options.fallbackDate || new Date().toISOString().slice(0, 10);
  if (!extractDate(rawText)) {
    missingFields.push("transaction_date");
  }

  // 4. Currency Detection
  const currency = extractCurrency(rawText) || options.defaultCurrency || "INR";

  // 5. Total, Subtotal, Tax, Discount Extraction
  const financialTotals = extractFinancialAmounts(lines, rawText);
  if (financialTotals.total <= 0) {
    missingFields.push("total");
  }

  // 6. Payment Method Detection
  const paymentMethod = extractPaymentMethod(rawText);

  // 7. Line Items Extraction
  const items = extractLineItems(lines, rawText);

  return {
    merchant: cleanMerchantName(merchant),
    invoice_number: invoiceNumber,
    transaction_date: transactionDate,
    currency,
    subtotal: financialTotals.subtotal > 0 ? financialTotals.subtotal : undefined,
    tax: financialTotals.tax > 0 ? financialTotals.tax : undefined,
    discount: financialTotals.discount > 0 ? financialTotals.discount : undefined,
    total: financialTotals.total,
    payment_method: paymentMethod,
    items,
    missing_fields: missingFields,
    raw_text: rawText
  };
}

/**
 * Extract merchant name from top lines or known merchant patterns
 */
export function extractMerchant(lines: string[], rawText: string): string {
  // Check for explicit "Merchant:" or "Store:" prefix
  const merchantPrefixRegex = /(?:merchant|store|vendor|seller|biller|retailer|business\s*name)\s*[:\-]\s*([A-Za-z0-9\s&'.\-]+)/i;
  const prefixMatch = rawText.match(merchantPrefixRegex);
  if (prefixMatch && prefixMatch[1].trim().length > 1) {
    return cleanMerchantName(prefixMatch[1].trim());
  }

  // Known popular merchants lookup in full text
  const knownMerchants = [
    "Amazon", "Flipkart", "Swiggy", "Zomato", "Uber", "Ola", "Rapido",
    "Zepto", "Blinkit", "BigBasket", "DMart", "Instamart", "McDonald's",
    "Starbucks", "Domino's Pizza", "KFC", "Burger King", "Subway", "Netflix",
    "Spotify", "YouTube", "Apple", "Google", "Airtel", "Jio", "BESCOM",
    "Apollo Pharmacy", "1mg", "Tata 1mg", "MedPlus", "Pharmeasy",
    "MakeMyTrip", "IndiGo", "Air India", "IRCTC", "Zara", "H&M", "Myntra",
    "Uniqlo", "Croma", "Reliance Digital", "Decathlon", "Shoppers Stop"
  ];

  for (const km of knownMerchants) {
    const regex = new RegExp(`\\b${km.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, "i");
    if (regex.test(rawText)) {
      return km;
    }
  }

  // Look at the first 3 lines (ignoring "Tax Invoice", "Bill of Supply", etc.)
  const skipPatterns = [
    /tax\s*invoice/i,
    /bill\s*of\s*supply/i,
    /receipt/i,
    /cash\s*memo/i,
    /retail\s*invoice/i,
    /e-way\s*bill/i,
    /original\s*for\s*recipient/i,
    /^gstin/i,
    /^date/i,
    /^tel/i,
    /^phone/i,
    /welcome\s*to/i
  ];

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].trim();
    if (line.length >= 2 && line.length <= 50 && !skipPatterns.some(p => p.test(line))) {
      return cleanMerchantName(line);
    }
  }

  return "Unknown Merchant";
}

export function cleanMerchantName(name: string): string {
  if (!name) return "Unknown Merchant";
  let clean = name
    .replace(/\b(Pvt\.?\s*Ltd\.?|Private\s*Limited|LLP|Inc\.?|Corp\.?|Corporation|Retail\s*India|Enterprises|Solutions)\b/gi, "")
    .replace(/[^\w\s&'.\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Fix all-caps to Title Case if > 3 chars
  if (clean.length > 3 && clean === clean.toUpperCase()) {
    clean = clean.split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  return clean || "Unknown Merchant";
}

/**
 * Extract invoice number (e.g. INV-12345, #98214, OD12398412)
 */
export function extractInvoiceNumber(rawText: string): string | undefined {
  const patterns = [
    /(?:invoice|bill|receipt|order|txn|reference|ref)\s*(?:no\.?|num|number|#)?\s*[:\-]?\s*([A-Za-z0-9\-_]{4,24})/i,
    /(?:inv|ord|rcpt)[#:\-\s]+([A-Za-z0-9\-_]{4,24})/i
  ];

  for (const p of patterns) {
    const m = rawText.match(p);
    if (m && m[1]) {
      const val = m[1].trim();
      // Exclude numbers that look like dates or currency
      if (!/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(val)) {
        return val;
      }
    }
  }
  return undefined;
}

/**
 * Extract date from bill and convert to ISO YYYY-MM-DD
 */
export function extractDate(rawText: string): string | null {
  // Formats:
  // 1. 30 Sep 2026, 30 September 2026, Sep 30, 2026
  // 2. 30/09/2026, 30-09-2026, 30.09.2026
  // 3. 2026-09-30
  const monthNames: Record<string, string> = {
    jan: "01", january: "01",
    feb: "02", february: "02",
    mar: "03", march: "03",
    apr: "04", april: "04",
    may: "05",
    jun: "06", june: "06",
    jul: "07", july: "07",
    aug: "08", august: "08",
    sep: "09", sept: "09", september: "09",
    oct: "10", october: "10",
    nov: "11", november: "11",
    dec: "12", december: "12"
  };

  // Pattern A: 30 Sep 2026 / 30-Sep-2026
  const textDateRegex = /\b(\d{1,2})[\s\-]+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s,]+(\d{4})\b/i;
  const matchA = rawText.match(textDateRegex);
  if (matchA) {
    const day = matchA[1].padStart(2, "0");
    const month = monthNames[matchA[2].toLowerCase()] || "01";
    const year = matchA[3];
    return `${year}-${month}-${day}`;
  }

  // Pattern B: Sep 30, 2026
  const textDateRegexB = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/i;
  const matchB = rawText.match(textDateRegexB);
  if (matchB) {
    const month = monthNames[matchB[1].toLowerCase()] || "01";
    const day = matchB[2].padStart(2, "0");
    const year = matchB[3];
    return `${year}-${month}-${day}`;
  }

  // Pattern C: ISO YYYY-MM-DD
  const isoRegex = /\b(20\d{2})[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])\b/;
  const matchC = rawText.match(isoRegex);
  if (matchC) {
    return `${matchC[1]}-${matchC[2]}-${matchC[3]}`;
  }

  // Pattern D: DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyyRegex = /\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d{2})\b/;
  const matchD = rawText.match(ddmmyyyyRegex);
  if (matchD) {
    const day = matchD[1].padStart(2, "0");
    const month = matchD[2].padStart(2, "0");
    const year = matchD[3];
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Currency detection
 */
export function extractCurrency(rawText: string): string {
  if (rawText.includes("₹") || /\bINR\b/i.test(rawText) || /\bRs\.?\b/i.test(rawText)) {
    return "INR";
  }
  if (rawText.includes("$") || /\bUSD\b/i.test(rawText)) return "USD";
  if (rawText.includes("€") || /\bEUR\b/i.test(rawText)) return "EUR";
  if (rawText.includes("£") || /\bGBP\b/i.test(rawText)) return "GBP";
  return "INR";
}

/**
 * Extract financial figures: Total, Subtotal, Tax, Discount
 */
export function extractFinancialAmounts(lines: string[], rawText: string): {
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
} {
  let total = 0;
  let subtotal = 0;
  let tax = 0;
  let discount = 0;

  // 1. Subtotal patterns
  const subtotalMatch = rawText.match(/(?:sub\s*total|subtotal|taxable\s*amount)[^:\d\r\n]{0,20}[:\-]?\s*(?:₹|inr|rs\.?)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (subtotalMatch && subtotalMatch[1]) {
    subtotal = parseNumericAmount(subtotalMatch[1]);
  }

  // 2. Total patterns (Prioritize explicit Grand / Net / Payable / Paid Total)
  const explicitGrandTotalRegex = /(?:grand\s*total|net\s*total|total\s*amount|final\s*amount|amount\s*payable|amount\s*paid|paid\s*amount|paid\s*via\s*[a-z]+)\s*[:\-]?\s*(?:₹|inr|rs\.?)?\s*([\d,]+(?:\.\d{1,2})?)/i;
  const grandMatch = rawText.match(explicitGrandTotalRegex);
  if (grandMatch && grandMatch[1]) {
    total = parseNumericAmount(grandMatch[1]);
  } else {
    // If no explicit grand total, look for standalone 'Total' with negative lookbehind for 'sub'
    const genericTotalRegex = /(?<!sub)\btotal\s*[:\-]?\s*(?:₹|inr|rs\.?)?\s*([\d,]+(?:\.\d{1,2})?)/i;
    const genMatch = rawText.match(genericTotalRegex);
    if (genMatch && genMatch[1]) {
      total = parseNumericAmount(genMatch[1]);
    }
  }

  // 3. Tax patterns (GST, CGST, SGST, IGST, VAT)
  // Skip percentage like '(18%)' or '18%' and capture the actual amount
  const taxRegex = /(?:gst|cgst|sgst|igst|tax|vat)(?:\s*(?:\([^)]*%\)|@?\s*\d+(?:\.\d+)?%))?[^:\d\r\n]{0,15}[:\-]?\s*(?:₹|inr|rs\.?)?\s*([\d,]+(?:\.\d{1,2})?)/gi;
  let taxMatch: RegExpExecArray | null;
  while ((taxMatch = taxRegex.exec(rawText)) !== null) {
    if (taxMatch[1]) {
      tax += parseNumericAmount(taxMatch[1]);
    }
  }

  // Discount patterns
  const discountMatch = rawText.match(/(?:discount|savings|promo|coupon|offer)\s*[:\-]?\s*(?:-)?\s*(?:₹|inr|rs\.?)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (discountMatch && discountMatch[1]) {
    discount = parseNumericAmount(discountMatch[1]);
  }

  // Fallback: If no explicit total found, search bottom lines for the largest currency figure
  if (total === 0) {
    const numberRegex = /(?:₹|inr|rs\.?)\s*([\d,]+(?:\.\d{1,2})?)/gi;
    let numMatch: RegExpExecArray | null;
    let maxFound = 0;
    while ((numMatch = numberRegex.exec(rawText)) !== null) {
      if (numMatch[1]) {
        const val = parseNumericAmount(numMatch[1]);
        if (val > maxFound && val < 1000000) {
          maxFound = val;
        }
      }
    }
    total = maxFound;
  }

  return { total, subtotal, tax, discount };
}

export function parseNumericAmount(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/,/g, "").trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

/**
 * Payment method detection
 */
export function extractPaymentMethod(rawText: string): string {
  const text = rawText.toLowerCase();
  if (text.includes("upi") || text.includes("gpay") || text.includes("phonepe") || text.includes("paytm") || text.includes("bhim")) {
    return "UPI";
  }
  if (text.includes("card") || text.includes("visa") || text.includes("mastercard") || text.includes("credit card") || text.includes("debit card") || text.includes("rupay")) {
    return "Card";
  }
  if (text.includes("netbanking") || text.includes("neft") || text.includes("rtgs") || text.includes("bank transfer") || text.includes("imps")) {
    return "Bank";
  }
  if (text.includes("cash") || text.includes("cod")) {
    return "Cash";
  }
  return "UPI";
}

/**
 * Line items extraction
 */
export function extractLineItems(lines: string[], rawText: string): BillItem[] {
  const items: BillItem[] = [];

  // 1. Look for structured item lines (e.g. "Nike T-Shirt 1 1499" or "Jeans 1000")
  for (const line of lines) {
    // Avoid headers, totals, and metadata
    if (
      /total|subtotal|tax|gst|invoice|date|merchant|paid|cash|card|upi|shipping|discount|thank/i.test(line)
    ) {
      continue;
    }

    // Pattern: Item Description followed by an amount (e.g. "Nike T-Shirt 1499" or "Jeans 1000")
    const itemAmountMatch = line.match(/^([A-Za-z0-9\s&'\-]{3,40})\s+(?:(\d+)\s+)?(?:₹|inr|rs\.?)?\s*([\d,]+(?:\.\d{2})?)$/i);
    if (itemAmountMatch) {
      const name = itemAmountMatch[1].trim();
      const qty = itemAmountMatch[2] ? parseInt(itemAmountMatch[2], 10) : 1;
      const price = parseNumericAmount(itemAmountMatch[3]);

      if (name.length > 2 && price > 0) {
        items.push({
          name,
          quantity: qty,
          unit_price: Math.round(price / qty),
          total_price: price
        });
      }
    }
  }

  // 2. If no line with amount matched, look for bullet points or listed item names
  if (items.length === 0) {
    const itemRegex = /(?:items?|purchased|products?)\s*[:\-]\s*([^\n\r]+)/i;
    const m = rawText.match(itemRegex);
    if (m && m[1]) {
      const parts = m[1].split(/[,;+&]/).map(p => p.trim()).filter(p => p.length > 1);
      for (const p of parts) {
        items.push({ name: p, quantity: 1 });
      }
    }
  }

  return items;
}
