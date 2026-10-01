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

