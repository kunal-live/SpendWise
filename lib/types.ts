export type BillItem = {
  name: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
};

export type Expense = {
  id: string;
  user_id?: string;
  title: string;
  category: string;
  amount: number;
  currency?: string;
  date: string;
  payment_method: string;
  is_recurring?: boolean;
  notes?: string;
  note?: string;
  merchant?: string;
  source?: "manual" | "bill_upload" | "import";
  bill_document_id?: string;
  classification_confidence?: number;
  invoice_number?: string;
  items?: BillItem[];
};

export type ExpenseCategory = {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ExtractedBillData = {
  merchant: string;
  invoice_number?: string;
  transaction_date: string;
  currency: string;
  subtotal?: number;
  tax?: number;
  discount?: number;
  total: number;
  payment_method: string;
  suggested_category: string;
  confidence: number; // 0.0 to 1.0
  confidence_level: "high" | "medium" | "low";
  classification_reason?: string;
  items: BillItem[];
  missing_fields?: string[];
  raw_text?: string;
  possible_duplicate?: {
    is_duplicate: boolean;
    existing_bill_id?: string;
    existing_expense_id?: string;
    message: string;
    matched_by: "file_hash" | "invoice_number" | "fingerprint";
    details?: {
      merchant: string;
      amount: number;
      date: string;
      invoice_number?: string;
    };
  };
};

export type BillDocument = {
  id: string;
  user_id: string;
  storage_key: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  file_hash: string;
  processing_status: "uploaded" | "ocr_processing" | "extraction_processing" | "classification_processing" | "review_required" | "confirmed" | "failed";
  ocr_status: "pending" | "processing" | "completed" | "failed";
  extraction_status: "pending" | "processing" | "completed" | "failed";
  classification_status: "pending" | "processing" | "completed" | "failed";
  raw_text?: string;
  extracted_data: ExtractedBillData;
  created_at: string;
  updated_at: string;
};

export type ClassificationFeedback = {
  id: string;
  user_id: string;
  bill_id?: string;
  original_category: string;
  corrected_category: string;
  merchant?: string;
  item_summary?: string;
  created_at: string;
};

export type MonthlySummary = {
  income: number;
  expenses: number;
  invested: number;
  saved: number;
};

export type EMI = {
  id: string;
  title: string;
  principal: number;
  tenureMonths: number;
  monthlyAmount: number;
  deductionDate: number; // 1-31
  startDate: string; // YYYY-MM-DD
  interestRate?: number; // Annual interest rate percentage (e.g. 10.5)
  totalInterest?: number; // Total interest over tenure
  totalPayable?: number; // Principal + Total Interest
  category?: string;
  notes?: string;
};

export type UserProfile = {
  id: string;
  user_id?: string;
  email?: string;
  username: string;
  name?: string;
  age?: number;
  dob?: string;
  gender?: string;
  city?: string;
  occupation?: string;
  profile_photo?: string;
  financial_type?: "student" | "earning" | "both";
  user_type?: string;
  goal?: string;
  monthly_income?: number;
  monthly_pocket_money?: number;
  current_spend?: number;
  monthly_investment?: number;
  created_at?: string;
  updated_at?: string;
};

export type User = {
  id: string;
  username: string;
  email: string;
  status: "active" | "inactive" | "suspended" | "locked";
  email_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type UserCredentials = {
  user_id: string;
  password_hash: string;
  password_changed_at: string;
  failed_attempts: number;
};

export type OAuthAccount = {
  id: string;
  user_id: string;
  provider: string;
  provider_user_id: string;
  created_at: string;
};

export type EmailVerification = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  verified_at?: string | null;
  created_at: string;
};

export type PasswordResetToken = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at?: string | null;
  created_at: string;
};

export type Session = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
};

export type LoginAttempt = {
  id: string;
  user_id?: string | null;
  ip_address?: string | null;
  attempted_at: string;
  success: boolean;
};

// ============================================================================
// Feature 2: Payment History & Bank Statement Import Types
// ============================================================================

export type TransactionDirection = "debit" | "credit";

export type TransactionType =
  | "expense"
  | "income"
  | "refund"
  | "transfer"
  | "cash_withdrawal"
  | "cash_deposit"
  | "card_payment"
  | "subscription"
  | "investment"
  | "loan"
  | "fee"
  | "unknown";

export type ImportSourceType = "bank_statement" | "payment_app" | "csv" | "pdf" | "xlsx";

export type ImportBatchStatus =
  | "uploaded"
  | "parsing"
  | "review_required"
  | "ready_to_import"
  | "imported"
  | "partially_imported"
  | "failed"
  | "cancelled";

export type ImportReviewStatus =
  | "pending"
  | "accepted"
  | "edited"
  | "ignored"
  | "duplicate"
  | "invalid";

export type DedupeStatus = "unique" | "possible_duplicate" | "exact_duplicate";

export type ImportCategorySummary = {
  category: string;
  count: number;
  totalAmount: number;
};

export type ImportBatchSummary = {
  totalTransactions: number;
  expensesDetected: number;
  incomeDetected: number;
  transfersDetected: number;
  refundsDetected: number;
  feesDetected: number;
  withdrawalsDetected: number;
  investmentsDetected: number;
  duplicatesDetected: number;
  needsReview: number;
  totalExpenseAmount: number;
  categoryBreakdown: ImportCategorySummary[];
};

export type ImportBatch = {
  id: string;
  user_id: string;
  source_type: ImportSourceType;
  source_name: string;
  original_filename: string;
  file_size: number;
  file_hash?: string;
  total_rows: number;
  processed_rows: number;
  created_expenses: number;
  review_count: number;
  duplicate_count: number;
  failed_count: number;
  status: ImportBatchStatus;
  summary: ImportBatchSummary;
  created_at: string;
  completed_at?: string | null;
};

export type ImportedTransaction = {
  id: string;
  import_batch_id: string;
  user_id: string;
  transaction_date: string; // YYYY-MM-DD
  value_date?: string;
  description: string;
  merchant?: string;
  amount: number;
  currency: string;
  direction: TransactionDirection;
  transaction_type: TransactionType;
  reference_id?: string;
  suggested_category_id?: string;
  suggested_category?: string;
  confidence_score: number;
  confidence_level: "high" | "medium" | "low";
  dedupe_status: DedupeStatus;
  dedupe_reason?: string;
  review_status: ImportReviewStatus;
  selected_category?: string;
  expense_id?: string | null;
  raw_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type ExpenseSource = {
  id: string;
  expense_id: string;
  user_id: string;
  import_batch_id?: string | null;
  source_type: "bank_statement" | "payment_app" | "bill_upload";
  source_name?: string;
  source_transaction_id?: string;
  source_record_hash?: string;
  created_at: string;
};

export type MerchantAlias = {
  id: string;
  canonical_merchant: string;
  alias: string;
  category_name?: string;
  created_at?: string;
  updated_at?: string;
};

export type Account = {
  id: string;
  user_id: string;
  institution_name: string;
  account_type: string;
  masked_identifier: string;
  currency: string;
  created_at: string;
};


