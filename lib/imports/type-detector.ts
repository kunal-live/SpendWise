import { TransactionDirection, TransactionType } from "@/lib/types";

export interface TypeDetectionResult {
  type: TransactionType;
  confidence: number;
  reason: string;
}

export function detectTransactionType(
  description: string,
  direction: TransactionDirection,
  rawType?: string
): TypeDetectionResult {
  const desc = description.toUpperCase().trim();
  const raw = (rawType || "").toUpperCase().trim();

  // Explicit type indicator overrides
  if (raw.includes("REFUND") || raw.includes("CASHBACK")) {
    return { type: "refund", confidence: 0.98, reason: "Explicitly tagged as refund/cashback" };
  }
  if (raw.includes("TRANSFER") || raw.includes("SELF")) {
    return { type: "transfer", confidence: 0.95, reason: "Explicitly tagged as transfer" };
  }

  // =========================================================================
  // 1. CREDIT Transactions (Money Coming In)
  // =========================================================================
  if (direction === "credit") {
    // Refunds & Reversals (Section 36 & 58)
    if (
      desc.includes("REFUND") ||
      desc.includes("REVERSAL") ||
      desc.includes("REV-") ||
      desc.includes("CASHBACK") ||
      desc.includes("CHARGEBACK") ||
      desc.includes("DISPUTE CREDIT") ||
      desc.includes("RETURN")
    ) {
      return { type: "refund", confidence: 0.96, reason: `Refund/Reversal pattern in narration: ${description}` };
    }

    // Salary & Payroll (Section 36 & 58)
    if (
      desc.includes("SALARY") ||
      desc.includes("PAYROLL") ||
      desc.includes("STIPEND") ||
      desc.includes("DIR DEP") ||
      desc.includes("DIRECT DEPOSIT") ||
      desc.includes("BONUS")
    ) {
      return { type: "income", confidence: 0.98, reason: `Salary/Income narration: ${description}` };
    }

    // Interest & Dividends
    if (
      desc.includes("INT.PD") ||
      desc.includes("INT PD") ||
      desc.includes("INTEREST CR") ||
      desc.includes("INTEREST CREDIT") ||
      desc.includes("DIVIDEND")
    ) {
      return { type: "income", confidence: 0.95, reason: "Bank interest/dividend credit" };
    }

    // Transfers from Self / Own Accounts
    if (
      desc.includes("SELF TRANSFER") ||
      desc.includes("OWN ACCOUNT") ||
      desc.includes("OWN A/C") ||
      desc.includes("TO OWN") ||
      desc.includes("FROM OWN")
    ) {
      return { type: "transfer", confidence: 0.94, reason: "Internal self transfer" };
    }

    // Cash Deposit
    if (desc.includes("CASH DEP") || desc.includes("CDM ") || desc.includes("CASH DEPOSIT")) {
      return { type: "cash_deposit", confidence: 0.95, reason: "Cash deposit into account" };
    }

    // Default Credit: Income
    return { type: "income", confidence: 0.85, reason: "Inflow / Credit transaction" };
  }

  // =========================================================================
  // 2. DEBIT Transactions (Money Going Out)
  // =========================================================================

  // Cash Withdrawals (ATM)
  if (
    desc.includes("ATM-WDL") ||
    desc.includes("ATM WDL") ||
    desc.includes("ATM CASH") ||
    desc.includes("CASH WDL") ||
    desc.includes("NFS*") ||
    desc.includes("ATM WITHDRAWAL")
  ) {
    return { type: "cash_withdrawal", confidence: 0.98, reason: "ATM cash withdrawal" };
  }

  // Self Transfers / Transfers between own accounts
  if (
    desc.includes("SELF TRANSFER") ||
    desc.includes("TRANSFER TO OWN") ||
    desc.includes("OWN A/C") ||
    desc.includes("OWN ACCOUNT") ||
    desc.includes("SWEEP TO") ||
    desc.includes("AUTO SWEEP")
  ) {
    return { type: "transfer", confidence: 0.95, reason: "Transfer between own accounts" };
  }

  // Credit Card Bill Payments (Transfer to liability, not individual new expense)
  if (
    desc.includes("CRED/") ||
    desc.includes("CRED CLUB") ||
    desc.includes("CC PAYMENT") ||
    desc.includes("BILLDESK CC") ||
    desc.includes("CREDIT CARD PYMT") ||
    desc.includes("CARD PAYMENT")
  ) {
    return { type: "card_payment", confidence: 0.94, reason: "Credit card bill payment" };
  }

  // Bank Fees & Taxes on Fees
  if (
    desc.includes("ANNUAL FEE") ||
    desc.includes("SMS CHG") ||
    desc.includes("CONSOLIDATED CHG") ||
    desc.includes("CONSOLIDATED CHARGE") ||
    desc.includes("CONSOLIDATED CHARGES") ||
    desc.includes("SERVICE CHARGE") ||
    desc.includes("PENAL CHARGE") ||
    desc.includes("MIN BAL CHG") ||
    desc.includes("GST ON CHARGES") ||
    desc.includes("ATM FEE") ||
    desc.includes("BANK CHARGES")
  ) {
    return { type: "fee", confidence: 0.95, reason: "Bank fee / service charge" };
  }

  // Investments (Brokerage, Mutual Funds, SIP)
  if (
    desc.includes("ZERODHA") ||
    desc.includes("GROWW") ||
    desc.includes("UPSTOX") ||
    desc.includes("MUTUAL FUND") ||
    desc.includes("MF PUR") ||
    desc.includes("SIP DEBIT") ||
    desc.includes("KUVERA") ||
    desc.includes("INDMONEY") ||
    desc.includes("COIN ")
  ) {
    return { type: "investment", confidence: 0.96, reason: "Investment / Mutual fund / SIP debit" };
  }

  // Subscriptions (Recurring services)
  if (
    desc.includes("NETFLIX") ||
    desc.includes("SPOTIFY") ||
    desc.includes("PRIME VIDEO") ||
    desc.includes("YOUTUBE PREMIUM") ||
    desc.includes("HOTSTAR") ||
    desc.includes("SUBSCRIPTION")
  ) {
    return { type: "expense", confidence: 0.95, reason: "Digital subscription expense" };
  }

  // Loans / EMIs
  if (
    desc.includes("EMI DEBIT") ||
    desc.includes("LOAN EMI") ||
    desc.includes("BAJAJ FINANCE") ||
    desc.includes("HDFC LOAN")
  ) {
    return { type: "loan", confidence: 0.92, reason: "Loan / EMI deduction" };
  }

  // Standard debit: Expense
  return { type: "expense", confidence: 0.90, reason: "Purchase / Merchant debit expense" };
}
