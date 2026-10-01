import crypto from "crypto";

export interface DuplicateCheckParams {
  userId: string;
  fileBuffer?: Buffer;
  merchant: string;
  total: number;
  transactionDate: string;
  invoiceNumber?: string;
  existingBills: Array<{
    id: string;
    file_hash?: string;
    merchant?: string;
    total?: number;
    transaction_date?: string;
    invoice_number?: string;
    created_at?: string;
    expense_id?: string;
  }>;
  existingExpenses?: Array<{
    id: string;
    merchant?: string;
    amount: number;
    date: string;
    invoice_number?: string;
  }>;
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  matchedBy?: "file_hash" | "invoice_number" | "fingerprint";
  existingBillId?: string;
  existingExpenseId?: string;
  message?: string;
  details?: {
    merchant: string;
    amount: number;
    date: string;
    invoice_number?: string;
  };
}

export function computeFileHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function detectDuplicateBill(params: DuplicateCheckParams): DuplicateDetectionResult {
  const { fileBuffer, merchant, total, transactionDate, invoiceNumber, existingBills, existingExpenses = [] } = params;
  const cleanMerchant = (merchant || "").trim().toLowerCase();

  // 1. Exact SHA-256 File Hash Match
  if (fileBuffer) {
    const currentHash = computeFileHash(fileBuffer);
    const hashMatch = existingBills.find(b => b.file_hash === currentHash);
    if (hashMatch) {
      return {
        isDuplicate: true,
        matchedBy: "file_hash",
        existingBillId: hashMatch.id,
        existingExpenseId: hashMatch.expense_id,
        message: `Duplicate document detected. This identical file was previously uploaded for ${hashMatch.merchant || "an expense"}.`,
        details: {
          merchant: hashMatch.merchant || merchant,
          amount: hashMatch.total || total,
          date: hashMatch.transaction_date || transactionDate,
          invoice_number: hashMatch.invoice_number || invoiceNumber
        }
      };
    }
  }

  // 2. Invoice Number Match (Strong Unique Identifier)
  if (invoiceNumber && invoiceNumber.trim().length > 3) {
    const cleanInv = invoiceNumber.trim().toLowerCase();

    // Check existing bills
    const billInvMatch = existingBills.find(b => 
      b.invoice_number && b.invoice_number.trim().toLowerCase() === cleanInv
    );
    if (billInvMatch) {
      return {
        isDuplicate: true,
        matchedBy: "invoice_number",
        existingBillId: billInvMatch.id,
        existingExpenseId: billInvMatch.expense_id,
        message: `Possible duplicate detected. Invoice #${invoiceNumber} already exists in your records.`,
        details: {
          merchant: billInvMatch.merchant || merchant,
          amount: billInvMatch.total || total,
          date: billInvMatch.transaction_date || transactionDate,
          invoice_number: invoiceNumber
        }
      };
    }

    // Check existing expenses
    const expInvMatch = existingExpenses.find(e => 
      e.invoice_number && e.invoice_number.trim().toLowerCase() === cleanInv
    );
    if (expInvMatch) {
      return {
        isDuplicate: true,
        matchedBy: "invoice_number",
        existingExpenseId: expInvMatch.id,
        message: `Possible duplicate detected. An expense with invoice #${invoiceNumber} already exists.`,
        details: {
          merchant: expInvMatch.merchant || merchant,
          amount: expInvMatch.amount,
          date: expInvMatch.date,
          invoice_number: invoiceNumber
        }
      };
    }
  }

  // 3. Composite Fingerprint Match (Merchant + Date + Total)
  if (cleanMerchant && total > 0 && transactionDate) {
    const matchingBill = existingBills.find(b => {
      const bMerchant = (b.merchant || "").trim().toLowerCase();
      const bDate = b.transaction_date || "";
      const bTotal = b.total || 0;
      return (
        bMerchant === cleanMerchant &&
        bDate === transactionDate &&
        Math.abs(bTotal - total) < 0.01
      );
    });

    if (matchingBill) {
      const formattedDate = formatDateDisplay(transactionDate);
      return {
        isDuplicate: true,
        matchedBy: "fingerprint",
        existingBillId: matchingBill.id,
        existingExpenseId: matchingBill.expense_id,
        message: `Possible duplicate detected. A ₹${total.toLocaleString("en-IN")} ${merchant} bill from ${formattedDate} already exists.`,
        details: {
          merchant: matchingBill.merchant || merchant,
          amount: matchingBill.total || total,
          date: matchingBill.transaction_date || transactionDate,
          invoice_number: matchingBill.invoice_number
        }
      };
    }

    const matchingExpense = existingExpenses.find(e => {
      const eMerchant = (e.merchant || "").trim().toLowerCase();
      const eDate = e.date || "";
      const eAmount = e.amount || 0;
      return (
        (eMerchant === cleanMerchant || (e as any).title?.toLowerCase().includes(cleanMerchant)) &&
        eDate === transactionDate &&
        Math.abs(eAmount - total) < 0.01
      );
    });

    if (matchingExpense) {
      const formattedDate = formatDateDisplay(transactionDate);
      return {
        isDuplicate: true,
        matchedBy: "fingerprint",
        existingExpenseId: matchingExpense.id,
        message: `Possible duplicate detected. A ₹${total.toLocaleString("en-IN")} ${merchant} expense on ${formattedDate} already exists.`,
        details: {
          merchant: matchingExpense.merchant || merchant,
          amount: matchingExpense.amount,
          date: matchingExpense.date,
          invoice_number: matchingExpense.invoice_number
        }
      };
    }
  }

  return { isDuplicate: false };
}

function formatDateDisplay(isoDate: string): string {
  try {
    const d = new Date(isoDate + "T00:00:00Z");
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return isoDate;
  }
}
