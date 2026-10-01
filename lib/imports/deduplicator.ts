import { DedupeStatus, Expense, ExpenseSource, ImportedTransaction } from "@/lib/types";

export interface DedupeCheckInput {
  userId: string;
  referenceId?: string;
  merchant?: string;
  amount: number;
  date: string; // YYYY-MM-DD
  direction: "debit" | "credit";
}

export interface DedupeResult {
  status: DedupeStatus;
  reason?: string;
  matchedExpenseId?: string;
  matchedReference?: string;
}

/**
 * Checks if two ISO dates are within toleranceDays of each other.
 */
export function isWithinDateTolerance(date1: string, date2: string, toleranceDays: number = 1): boolean {
  try {
    const d1 = new Date(date1).getTime();
    const d2 = new Date(date2).getTime();
    if (isNaN(d1) || isNaN(d2)) return false;
    const diffDays = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
    return diffDays <= toleranceDays;
  } catch {
    return false;
  }
}

/**
 * Evaluates duplicate status across existing expenses, past import sources, and staged transactions.
 */
export function evaluateTransactionDeduplication(
  input: DedupeCheckInput,
  existingExpenses: Expense[],
  existingSources: ExpenseSource[] = [],
  stagedTransactions: ImportedTransaction[] = []
): DedupeResult {
  const { referenceId, merchant, amount, date } = input;

  // =========================================================================
  // Priority 1: Reference ID / UTR / Transaction ID (Exact Match)
  // =========================================================================
  if (referenceId && referenceId.trim().length >= 6) {
    const refClean = referenceId.trim().toUpperCase();

    // Check expense_sources audit table
    const sourceMatch = existingSources.find(
      s => (s.source_transaction_id || "").toUpperCase() === refClean
    );
    if (sourceMatch) {
      return {
        status: "exact_duplicate",
        reason: `Matched existing transaction reference ID: ${referenceId}`,
        matchedExpenseId: sourceMatch.expense_id,
        matchedReference: referenceId
      };
    }

    // Check existing expenses invoice_number or title
    const expenseRefMatch = existingExpenses.find(
      e => (e.invoice_number || "").toUpperCase() === refClean || (e.notes || "").toUpperCase().includes(refClean)
    );
    if (expenseRefMatch) {
      return {
        status: "exact_duplicate",
        reason: `Matched existing expense by Reference/Invoice #${referenceId}`,
        matchedExpenseId: expenseRefMatch.id,
        matchedReference: referenceId
      };
    }

    // Check existing staged transactions
    const stagedMatch = stagedTransactions.find(
      s => (s.reference_id || "").toUpperCase() === refClean
    );
    if (stagedMatch) {
      return {
        status: "exact_duplicate",
        reason: `Duplicate reference ID within statement/staged imports: ${referenceId}`,
        matchedExpenseId: stagedMatch.expense_id || undefined,
        matchedReference: referenceId
      };
    }
  }

  // =========================================================================
  // Priority 2: Fallback Composite Matching (user_id + amount + merchant + date ± 1 day)
  // =========================================================================
  const normMerchant = (merchant || "").toLowerCase().trim();

  for (const exp of existingExpenses) {
    const expAmount = Math.abs(Number(exp.amount));
    const inputAmount = Math.abs(Number(amount));

    // Amount match
    if (Math.abs(expAmount - inputAmount) < 0.01) {
      const expMerchant = (exp.merchant || exp.title || "").toLowerCase().trim();
      const merchantsOverlap =
        (normMerchant && expMerchant.includes(normMerchant)) ||
        (normMerchant && normMerchant.includes(expMerchant)) ||
        (normMerchant.length > 0 && expMerchant.length > 0 && normMerchant === expMerchant);

      if (merchantsOverlap && isWithinDateTolerance(date, exp.date, 1)) {
        return {
          status: "possible_duplicate",
          reason: `Possible duplicate: ₹${amount.toLocaleString()} at ${exp.merchant || exp.title} on ${exp.date} already exists (±1 day)`,
          matchedExpenseId: exp.id
        };
      }
    }
  }

  return { status: "unique" };
}
