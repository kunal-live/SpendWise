import {
  ImportedTransaction,
  TransactionDirection,
  Expense,
  ExpenseSource,
  MerchantAlias
} from "@/lib/types";
import { ParsedRawTransaction } from "./parsers/types";
import { detectTransactionType } from "./type-detector";
import { normalizeMerchant } from "./merchant-normalizer";
import { classifyExpenseCategory } from "@/lib/bills/classifier/classifier";
import { evaluateTransactionDeduplication } from "./deduplicator";

/**
 * Standardize varied date strings into ISO YYYY-MM-DD.
 */
export function normalizeDateToIso(rawDate: string): string {
  if (!rawDate) return new Date().toISOString().slice(0, 10);
  const clean = rawDate.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    let year = dmyMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  // DD Mon YYYY or DD-Mon-YYYY (e.g. 30 Sep 2026 or 01-SEP-2026)
  const monMatch = clean.match(/^(\d{1,2})[-\s]([A-Za-z]{3})[-\s](\d{2,4})$/);
  if (monMatch) {
    const day = monMatch[1].padStart(2, "0");
    const monthStr = monMatch[2].toLowerCase();
    let year = monMatch[3];
    if (year.length === 2) year = `20${year}`;

    const months: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
    };
    const month = months[monthStr] || "01";
    return `${year}-${month}-${day}`;
  }

  // Try standard Date parse
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

export function normalizeImportedTransaction(
  raw: ParsedRawTransaction,
  batchId: string,
  userId: string,
  userAliases: MerchantAlias[] = [],
  existingExpenses: Expense[] = [],
  existingSources: ExpenseSource[] = [],
  previouslyStaged: ImportedTransaction[] = []
): ImportedTransaction {
  const transactionDate = normalizeDateToIso(raw.date);
  const valueDate = raw.valueDate ? normalizeDateToIso(raw.valueDate) : undefined;

  // 1. Determine direction (debit vs credit)
  let direction: TransactionDirection = "debit";
  let amount = 0;

  if (raw.credit !== undefined && raw.credit > 0) {
    direction = "credit";
    amount = raw.credit;
  } else if (raw.debit !== undefined && raw.debit > 0) {
    direction = "debit";
    amount = raw.debit;
  } else if (raw.amount !== undefined) {
    amount = Math.abs(raw.amount);
    const rawType = (raw.rawType || "").toLowerCase();
    if (rawType.includes("cr") || rawType.includes("credit") || raw.amount < 0) {
      direction = "credit";
    } else {
      direction = "debit";
    }
  }

  // 2. Detect transaction type (income, refund, transfer, fee, investment, expense, etc.)
  const typeResult = detectTransactionType(raw.description, direction, raw.rawType);

  // 3. Normalize merchant
  const merchantResult = normalizeMerchant(raw.description, userAliases);

  // 4. Category Classification Engine (Reusing layered rule + keyword engine from bills)
  const classification = classifyExpenseCategory({
    merchant: merchantResult.merchant,
    billText: `${raw.description} ${merchantResult.merchant}`,
    items: [{ name: merchantResult.cleanedDescription }]
  });

  const suggestedCategory = merchantResult.suggestedCategory || classification.category;
  const confidenceScore = merchantResult.isKnownMerchant
    ? Math.max(0.92, classification.confidence)
    : classification.confidence;
  const confidenceLevel = confidenceScore >= 0.90 ? "high" : confidenceScore >= 0.70 ? "medium" : "low";

  // 5. Deduplication check
  const dedupeResult = evaluateTransactionDeduplication(
    {
      userId,
      referenceId: raw.reference,
      merchant: merchantResult.merchant,
      amount,
      date: transactionDate,
      direction
    },
    existingExpenses,
    existingSources,
    previouslyStaged
  );

  // 6. Initial review status
  let reviewStatus: ImportedTransaction["review_status"] = "pending";
  if (dedupeResult.status === "exact_duplicate" || dedupeResult.status === "possible_duplicate") {
    reviewStatus = "duplicate";
  } else if (typeResult.type === "expense" && confidenceLevel === "high") {
    reviewStatus = "accepted"; // Auto-prepared for confirmation
  } else {
    reviewStatus = "pending"; // Needs user review
  }

  const txnId = `txn_${crypto.randomUUID()}`;

  return {
    id: txnId,
    import_batch_id: batchId,
    user_id: userId,
    transaction_date: transactionDate,
    value_date: valueDate,
    description: raw.description,
    merchant: merchantResult.merchant,
    amount,
    currency: "INR",
    direction,
    transaction_type: typeResult.type,
    reference_id: raw.reference,
    suggested_category_id: suggestedCategory.toLowerCase().replace(/[^a-z0-9]/g, "_"),
    suggested_category: suggestedCategory,
    confidence_score: confidenceScore,
    confidence_level: confidenceLevel,
    dedupe_status: dedupeResult.status,
    dedupe_reason: dedupeResult.reason,
    review_status: reviewStatus,
    selected_category: suggestedCategory,
    expense_id: dedupeResult.matchedExpenseId || null,
    raw_data: {
      ...raw.rawData,
      type_reason: typeResult.reason,
      classification_reason: classification.reason
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
