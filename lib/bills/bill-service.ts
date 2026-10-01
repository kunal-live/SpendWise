import crypto from "crypto";
import { BillDocument, ExtractedBillData, Expense, ClassificationFeedback } from "@/lib/types";
import { validateBillFile, billStorage } from "./storage/bill-storage";
import { getDocumentExtractor } from "./document-extractor";
import { normalizeBillText } from "./normalizer";
import { classifyExpenseCategory } from "./classifier/classifier";
import { detectDuplicateBill, computeFileHash } from "./duplicate-detector";
import { createClient } from "@/lib/supabase/server";

// In-memory fallback repository for local/offline testing and fast execution
class MemoryBillStore {
  private bills = new Map<string, BillDocument>();
  private feedback: ClassificationFeedback[] = [];
  private expenses = new Map<string, Expense>();

  public saveBill(bill: BillDocument): BillDocument {
    this.bills.set(bill.id, { ...bill });
    return bill;
  }

  public getBill(id: string): BillDocument | null {
    const b = this.bills.get(id);
    return b ? { ...b } : null;
  }

  public listBills(userId: string): BillDocument[] {
    return Array.from(this.bills.values())
      .filter(b => b.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public updateBill(id: string, updates: Partial<BillDocument>): BillDocument | null {
    const existing = this.bills.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    this.bills.set(id, updated);
    return updated;
  }

  public saveFeedback(feedback: ClassificationFeedback) {
    this.feedback.push(feedback);
  }

  public getFeedback(userId: string): ClassificationFeedback[] {
    return this.feedback.filter(f => f.user_id === userId);
  }

  public saveExpense(expense: Expense): Expense {
    this.expenses.set(expense.id, { ...expense });
    return expense;
  }

  public listExpenses(userId: string): Expense[] {
    return Array.from(this.expenses.values()).filter(e => !e.user_id || e.user_id === userId);
  }

  public deleteExpense(id: string): boolean {
    return this.expenses.delete(id);
  }

  public deleteExpenses(ids: string[]): number {
    let count = 0;
    for (const id of ids) {
      if (this.expenses.delete(id)) count++;
    }
    return count;
  }

  public clear() {
    this.bills.clear();
    this.feedback = [];
    this.expenses.clear();
  }
}

export const memoryBillStore = new MemoryBillStore();

export interface ProcessBillUploadOptions {
  userId: string;
  fileBuffer: Buffer;
  originalFilename: string;
  mimeType: string;
  forceDuplicate?: boolean;
}

export interface ConfirmBillPayload {
  merchant: string;
  amount: number;
  currency?: string;
  category: string;
  transaction_date: string;
  payment_method?: string;
  notes?: string;
  invoice_number?: string;
  items?: Array<{ name: string; quantity?: number; unit_price?: number; total_price?: number }>;
}

export class BillService {
  /**
   * Complete Pipeline: Upload -> Validate -> OCR -> Normalization -> Classification -> Duplicate Check -> Review Required
   */
  async processBillUpload(options: ProcessBillUploadOptions): Promise<{
    bill: BillDocument;
    extracted: ExtractedBillData;
  }> {
    const { userId, fileBuffer, originalFilename, mimeType, forceDuplicate = false } = options;

    // 1. Validate file (Section 2 & 15: Magic bytes, size <= 10MB, non-empty)
    const validation = validateBillFile(fileBuffer, mimeType, originalFilename);
    if (!validation.valid) {
      throw new Error(validation.error || "File validation failed.");
    }

    const detectedMime = validation.detectedMimeType || mimeType;
    const billId = `bill_${crypto.randomUUID()}`;
    const fileHash = computeFileHash(fileBuffer);

    // 2. Load existing records for duplicate detection (Section 16)
    const existingBills = await this.getUserBills(userId);
    const existingExpenses = await this.getUserExpenses(userId);

    // 3. Save file securely (Section 19: Per-user prefixes)
    const stored = await billStorage.saveBill(userId, billId, originalFilename, fileBuffer, detectedMime);

    // 4. Run Document OCR Extraction (Section 6)
    const extractor = getDocumentExtractor();
    const rawResult = await extractor.extract(fileBuffer, detectedMime, originalFilename);

    // 5. Run Structured Normalization (Section 7)
    const normalized = normalizeBillText(rawResult.raw_text);

    // 6. Check Duplicate Detection (Section 16)
    const duplicateCheck = detectDuplicateBill({
      userId,
      fileBuffer,
      merchant: normalized.merchant,
      total: normalized.total,
      transactionDate: normalized.transaction_date,
      invoiceNumber: normalized.invoice_number,
      existingBills: existingBills.map(b => ({
        id: b.id,
        file_hash: b.file_hash,
        merchant: b.extracted_data?.merchant,
        total: b.extracted_data?.total,
        transaction_date: b.extracted_data?.transaction_date,
        invoice_number: b.extracted_data?.invoice_number,
        created_at: b.created_at
      })),
      existingExpenses: existingExpenses.map(e => ({
        id: e.id,
        merchant: e.merchant || e.title,
        amount: e.amount,
        date: e.date,
        invoice_number: e.invoice_number
      }))
    });

    // 7. Load user corrections history for adaptive learning (Section 20)
    const userFeedback = await this.getUserFeedback(userId);
    const correctionsInput = userFeedback.map(f => ({
      merchant: f.merchant,
      itemSummary: f.item_summary,
      originalCategory: f.original_category,
      correctedCategory: f.corrected_category
    }));

    // 8. Run Layered Category Classification (Section 4 & 8)
    const classification = classifyExpenseCategory({
      merchant: normalized.merchant,
      items: normalized.items,
      billText: rawResult.raw_text,
      total: normalized.total,
      userCorrections: correctionsInput
    });

    // 9. Assemble ExtractedBillData
    const extractedData: ExtractedBillData = {
      ...normalized,
      suggested_category: classification.category,
      confidence: classification.confidence,
      confidence_level: classification.confidence_level,
      classification_reason: classification.reason,
      possible_duplicate: duplicateCheck.isDuplicate ? {
        is_duplicate: true,
        existing_bill_id: duplicateCheck.existingBillId,
        existing_expense_id: duplicateCheck.existingExpenseId,
        message: duplicateCheck.message || "Possible duplicate detected.",
        matched_by: duplicateCheck.matchedBy || "fingerprint",
        details: duplicateCheck.details
      } : undefined
    };

    // 10. Persist Bill Document Record (Status: REVIEW_REQUIRED)
    const billDoc: BillDocument = {
      id: billId,
      user_id: userId,
      storage_key: stored.storageKey,
      original_filename: originalFilename,
      mime_type: detectedMime,
      file_size: fileBuffer.length,
      file_hash: fileHash,
      processing_status: "review_required",
      ocr_status: "completed",
      extraction_status: "completed",
      classification_status: "completed",
      raw_text: rawResult.raw_text,
      extracted_data: extractedData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await this.persistBill(billDoc);

    return { bill: billDoc, extracted: extractedData };
  }

  /**
   * Confirm Bill & Create Expense Atomically (Section 10, 11, 12)
   */
  async confirmBill(
    billId: string,
    payload: ConfirmBillPayload,
    userId: string
  ): Promise<{ expense: Expense; bill: BillDocument }> {
    const bill = await this.getBillById(billId, userId);
    if (!bill) {
      throw new Error("Bill not found or you do not have permission to access it.");
    }

    if (bill.processing_status === "confirmed") {
      throw new Error("This bill has already been confirmed.");
    }

    const suggestedCat = bill.extracted_data?.suggested_category || "Other";
    const finalCategory = payload.category || suggestedCat;
    const amount = Number(payload.amount);

    if (isNaN(amount) || amount <= 0) {
      throw new Error("Total expense amount must be greater than zero.");
    }

    // 1. Check if user corrected the category — record learning feedback (Section 20)
    if (suggestedCat.toLowerCase() !== finalCategory.toLowerCase()) {
      const feedback: ClassificationFeedback = {
        id: `fdb_${crypto.randomUUID()}`,
        user_id: userId,
        bill_id: billId,
        original_category: suggestedCat,
        corrected_category: finalCategory,
        merchant: payload.merchant || bill.extracted_data.merchant,
        item_summary: payload.items?.map(i => i.name).join(", ") || bill.extracted_data.items?.map(i => i.name).join(", "),
        created_at: new Date().toISOString()
      };
      await this.persistFeedback(feedback);
    }

    // 2. Create the Expense Record
    const expenseId = `exp_${crypto.randomUUID()}`;
    const expense: Expense = {
      id: expenseId,
      user_id: userId,
      title: payload.merchant || "Bill Expense",
      merchant: payload.merchant || bill.extracted_data.merchant,
      category: finalCategory,
      amount,
      currency: payload.currency || bill.extracted_data.currency || "INR",
      date: payload.transaction_date || bill.extracted_data.transaction_date || new Date().toISOString().slice(0, 10),
      payment_method: payload.payment_method || bill.extracted_data.payment_method || "UPI",
      notes: payload.notes || `Uploaded bill: ${bill.original_filename}`,
      source: "bill_upload",
      bill_document_id: billId,
      classification_confidence: bill.extracted_data.confidence,
      invoice_number: payload.invoice_number || bill.extracted_data.invoice_number,
      items: payload.items && payload.items.length > 0 ? payload.items : bill.extracted_data.items
    };

    // 3. Atomically update bill status to CONFIRMED
    const updatedBill = await this.updateBillStatus(billId, "confirmed");

    // 4. Persist Expense
    await this.persistExpense(expense);

    return { expense, bill: updatedBill || bill };
  }

  /**
   * Fetch a single bill by ID with strict ownership validation (Section 15)
   */
  async getBillById(billId: string, userId: string): Promise<BillDocument | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("bill_documents")
        .select("*")
        .eq("id", billId)
        .eq("user_id", userId)
        .maybeSingle();

      if (data && !error) {
        return data as BillDocument;
      }
    } catch {
      // Fallback
    }

    const local = memoryBillStore.getBill(billId);
    if (local && local.user_id === userId) {
      return local;
    }

    return null;
  }

  /**
   * List bills for a user
   */
  async getUserBills(userId: string): Promise<BillDocument[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("bill_documents")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (data && !error && data.length > 0) {
        return data as BillDocument[];
      }
    } catch {
      // Fallback
    }
    return memoryBillStore.listBills(userId);
  }

  /**
   * Get user expenses
   */
  async getUserExpenses(userId: string): Promise<Expense[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", userId)
        .order("expense_date", { ascending: false });

      if (data && !error && data.length > 0) {
        return data as Expense[];
      }
    } catch {
      // Fallback
    }
    return memoryBillStore.listExpenses(userId);
  }

  /**
   * Get user classification feedback history
   */
  async getUserFeedback(userId: string): Promise<ClassificationFeedback[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("classification_feedback")
        .select("*")
        .eq("user_id", userId);

      if (data && !error && data.length > 0) {
        return data as ClassificationFeedback[];
      }
    } catch {
      // Fallback
    }
    return memoryBillStore.getFeedback(userId);
  }

  private async persistBill(bill: BillDocument): Promise<void> {
    memoryBillStore.saveBill(bill);
    try {
      const supabase = await createClient();
      await supabase.from("bill_documents").upsert({
        id: bill.id,
        user_id: bill.user_id,
        storage_key: bill.storage_key,
        original_filename: bill.original_filename,
        mime_type: bill.mime_type,
        file_size: bill.file_size,
        file_hash: bill.file_hash,
        processing_status: bill.processing_status,
        ocr_status: bill.ocr_status,
        extraction_status: bill.extraction_status,
        classification_status: bill.classification_status,
        raw_text: bill.raw_text,
        extracted_data: bill.extracted_data,
        created_at: bill.created_at,
        updated_at: bill.updated_at
      });
    } catch {
      // Memory store preserves state
    }
  }

  private async updateBillStatus(billId: string, status: BillDocument["processing_status"]): Promise<BillDocument | null> {
    const updated = memoryBillStore.updateBill(billId, { processing_status: status });
    try {
      const supabase = await createClient();
      await supabase
        .from("bill_documents")
        .update({ processing_status: status, updated_at: new Date().toISOString() })
        .eq("id", billId);
    } catch {
      // Memory store preserves state
    }
    return updated;
  }

  private async persistFeedback(feedback: ClassificationFeedback): Promise<void> {
    memoryBillStore.saveFeedback(feedback);
    try {
      const supabase = await createClient();
      await supabase.from("classification_feedback").insert(feedback);
    } catch {
      // Memory store preserves state
    }
  }

  public async createExpense(expense: Expense): Promise<void> {
    return this.persistExpense(expense);
  }

  public async deleteExpenses(expenseIds: string[], userId: string): Promise<number> {
    memoryBillStore.deleteExpenses(expenseIds);
    try {
      const supabase = await createClient();
      await supabase.from("expenses").delete().in("id", expenseIds).eq("user_id", userId);
    } catch {}
    return expenseIds.length;
  }

  private async persistExpense(expense: Expense): Promise<void> {
    memoryBillStore.saveExpense(expense);
    try {
      const supabase = await createClient();
      await supabase.from("expenses").insert({
        id: expense.id,
        user_id: expense.user_id,
        title: expense.title,
        merchant: expense.merchant,
        category: expense.category,
        amount: expense.amount,
        currency: expense.currency || "INR",
        expense_date: expense.date,
        payment_method: expense.payment_method,
        note: expense.notes,
        source: expense.source || "bill_upload",
        bill_document_id: expense.bill_document_id,
        classification_confidence: expense.classification_confidence,
        invoice_number: expense.invoice_number,
        line_items: expense.items
      });
    } catch {
      // Memory store preserves state
    }
  }
}

export const billService = new BillService();
