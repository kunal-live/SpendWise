import crypto from "crypto";
import {
  ImportBatch,
  ImportedTransaction,
  Expense,
  ExpenseSource,
  MerchantAlias,
  ImportBatchSummary,
  ImportCategorySummary
} from "@/lib/types";
import { parseStatementFile } from "./parsers";
import { normalizeImportedTransaction } from "./normalizer";
import { computeFileHash } from "@/lib/bills/duplicate-detector";
import { createClient } from "@/lib/supabase/server";
import { billService } from "@/lib/bills/bill-service";

class MemoryImportStore {
  private batches = new Map<string, ImportBatch>();
  private transactions = new Map<string, ImportedTransaction>();
  private sources: ExpenseSource[] = [];
  private aliases: MerchantAlias[] = [];

  public saveBatch(batch: ImportBatch): ImportBatch {
    this.batches.set(batch.id, { ...batch });
    return batch;
  }

  public getBatch(id: string): ImportBatch | null {
    const b = this.batches.get(id);
    return b ? { ...b } : null;
  }

  public listBatches(userId: string): ImportBatch[] {
    return Array.from(this.batches.values())
      .filter(b => b.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public saveTransactions(txns: ImportedTransaction[]) {
    for (const t of txns) {
      this.transactions.set(t.id, { ...t });
    }
  }

  public getTransaction(id: string): ImportedTransaction | null {
    const t = this.transactions.get(id);
    return t ? { ...t } : null;
  }

  public listTransactions(batchId: string): ImportedTransaction[] {
    return Array.from(this.transactions.values())
      .filter(t => t.import_batch_id === batchId)
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
  }

  public updateTransaction(id: string, updates: Partial<ImportedTransaction>): ImportedTransaction | null {
    const existing = this.transactions.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    this.transactions.set(id, updated);
    return updated;
  }

  public saveExpenseSource(source: ExpenseSource) {
    this.sources.push(source);
  }

  public listSources(userId?: string): ExpenseSource[] {
    if (!userId) return [...this.sources];
    return this.sources.filter(s => s.user_id === userId);
  }

  public deleteSourcesByBatch(batchId: string): string[] {
    const deletedExpenseIds: string[] = [];
    this.sources = this.sources.filter(s => {
      if (s.import_batch_id === batchId) {
        deletedExpenseIds.push(s.expense_id);
        return false;
      }
      return true;
    });
    return deletedExpenseIds;
  }

  public clear() {
    this.batches.clear();
    this.transactions.clear();
    this.sources = [];
    this.aliases = [];
  }
}

export const memoryImportStore = new MemoryImportStore();

export interface ProcessImportUploadOptions {
  userId: string;
  fileBuffer: Buffer;
  originalFilename: string;
  preferredSource?: string;
}

export class ImportService {
  /**
   * Complete Ingestion Pipeline:
   * Upload -> File Hash -> Parse -> Normalization -> Type Detect -> Categorize -> Dedupe -> Stage
   */
  async processImportUpload(options: ProcessImportUploadOptions): Promise<{
    batch: ImportBatch;
    transactions: ImportedTransaction[];
  }> {
    const { userId, fileBuffer, originalFilename, preferredSource } = options;

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("Cannot process empty file.");
    }
    if (fileBuffer.length > 15 * 1024 * 1024) {
      throw new Error("File exceeds maximum allowed size (15MB).");
    }

    const fileHash = computeFileHash(fileBuffer);
    const batchId = `imp_${crypto.randomUUID()}`;

    // 1. Parse File (CSV, PDF, or Payment App export)
    const parseResult = await parseStatementFile(originalFilename, fileBuffer, preferredSource);

    if (!parseResult.transactions || parseResult.transactions.length === 0) {
      throw new Error("No valid transactions found in the uploaded file. Check the file format.");
    }

    // 2. Fetch existing records for cross-source deduplication
    const existingExpenses = await billService.getUserExpenses(userId);
    const existingSources = await this.getUserExpenseSources(userId);
    const userAliases = await this.getUserMerchantAliases(userId);

    // 3. Normalize, type-detect, categorize, and dedupe every row
    const stagedTransactions: ImportedTransaction[] = [];

    for (const raw of parseResult.transactions) {
      const normalized = normalizeImportedTransaction(
        raw,
        batchId,
        userId,
        userAliases,
        existingExpenses,
        existingSources,
        stagedTransactions
      );
      stagedTransactions.push(normalized);
    }

    // 4. Compute Summary Statistics
    const summary = this.computeBatchSummary(stagedTransactions);

    const batch: ImportBatch = {
      id: batchId,
      user_id: userId,
      source_type: parseResult.sourceType,
      source_name: parseResult.sourceName || preferredSource || "Bank Statement",
      original_filename: originalFilename,
      file_size: fileBuffer.length,
      file_hash: fileHash,
      total_rows: stagedTransactions.length,
      processed_rows: stagedTransactions.length,
      created_expenses: 0,
      review_count: summary.needsReview,
      duplicate_count: summary.duplicatesDetected,
      failed_count: 0,
      status: "review_required",
      summary,
      created_at: new Date().toISOString()
    };

    // 5. Persist batch & staging transactions
    await this.persistBatch(batch);
    await this.persistTransactions(stagedTransactions);

    return {
      batch,
      transactions: stagedTransactions
    };
  }

  /**
   * Recalculates summary breakdown for a set of transactions
   */
  public computeBatchSummary(txns: ImportedTransaction[]): ImportBatchSummary {
    let expensesDetected = 0;
    let incomeDetected = 0;
    let transfersDetected = 0;
    let refundsDetected = 0;
    let feesDetected = 0;
    let withdrawalsDetected = 0;
    let investmentsDetected = 0;
    let duplicatesDetected = 0;
    let needsReview = 0;
    let totalExpenseAmount = 0;

    const categoryMap: Record<string, { count: number; totalAmount: number }> = {};

    for (const t of txns) {
      if (t.dedupe_status !== "unique") {
        duplicatesDetected++;
      }

      if (t.review_status === "pending" || t.confidence_level === "low") {
        needsReview++;
      }

      switch (t.transaction_type) {
        case "expense":
          expensesDetected++;
          totalExpenseAmount += t.amount;
          const cat = t.selected_category || t.suggested_category || "Other";
          if (!categoryMap[cat]) categoryMap[cat] = { count: 0, totalAmount: 0 };
          categoryMap[cat].count++;
          categoryMap[cat].totalAmount += t.amount;
          break;
        case "income":
          incomeDetected++;
          break;
        case "transfer":
          transfersDetected++;
          break;
        case "refund":
          refundsDetected++;
          break;
        case "fee":
          feesDetected++;
          totalExpenseAmount += t.amount;
          break;
        case "cash_withdrawal":
          withdrawalsDetected++;
          break;
        case "investment":
          investmentsDetected++;
          break;
      }
    }

    const categoryBreakdown: ImportCategorySummary[] = Object.entries(categoryMap)
      .map(([category, val]) => ({
        category,
        count: val.count,
        totalAmount: Math.round(val.totalAmount * 100) / 100
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      totalTransactions: txns.length,
      expensesDetected,
      incomeDetected,
      transfersDetected,
      refundsDetected,
      feesDetected,
      withdrawalsDetected,
      investmentsDetected,
      duplicatesDetected,
      needsReview,
      totalExpenseAmount: Math.round(totalExpenseAmount * 100) / 100,
      categoryBreakdown
    };
  }

  /**
   * Get single batch with its summary
   */
  async getBatch(batchId: string, userId: string): Promise<ImportBatch | null> {
    const batch = memoryImportStore.getBatch(batchId);
    if (batch && batch.user_id === userId) return batch;

    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("import_batches")
        .select("*")
        .eq("id", batchId)
        .eq("user_id", userId)
        .single();
      if (data) return data as ImportBatch;
    } catch {
      // Fallback
    }
    return null;
  }

  /**
   * Get transactions for review
   */
  async getBatchTransactions(batchId: string, userId: string): Promise<ImportedTransaction[]> {
    const list = memoryImportStore.listTransactions(batchId);
    if (list.length > 0) return list;

    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("imported_transactions")
        .select("*")
        .eq("import_batch_id", batchId)
        .eq("user_id", userId)
        .order("transaction_date", { ascending: false });
      if (data) return data as ImportedTransaction[];
    } catch {
      // Fallback
    }
    return [];
  }

  /**
   * Update single transaction (category, transaction_type, review_status)
   */
  async updateTransaction(
    batchId: string,
    txnId: string,
    updates: Partial<ImportedTransaction>,
    userId: string
  ): Promise<ImportedTransaction | null> {
    const finalUpdates: Partial<ImportedTransaction> = {
      ...updates,
      review_status: updates.review_status || (updates.selected_category || updates.transaction_type ? "edited" : undefined)
    };
    const updated = memoryImportStore.updateTransaction(txnId, finalUpdates);
    try {
      const supabase = await createClient();
      await supabase
        .from("imported_transactions")
        .update({ ...finalUpdates, updated_at: new Date().toISOString() })
        .eq("id", txnId)
        .eq("user_id", userId);
    } catch {
      // Fallback
    }

    // Refresh batch summary
    const all = await this.getBatchTransactions(batchId, userId);
    const newSummary = this.computeBatchSummary(all);
    const batch = await this.getBatch(batchId, userId);
    if (batch) {
      batch.summary = newSummary;
      batch.review_count = newSummary.needsReview;
      await this.persistBatch(batch);
    }

    return updated;
  }

  /**
   * Bulk update transactions (Assign Category, Mark as Transfer, Ignore)
   */
  async bulkUpdateTransactions(
    batchId: string,
    txnIds: string[],
    updates: Partial<ImportedTransaction>,
    userId: string
  ): Promise<number> {
    const finalUpdates: Partial<ImportedTransaction> = {
      ...updates,
      review_status: updates.review_status || (updates.selected_category || updates.transaction_type ? "edited" : undefined)
    };
    let count = 0;
    for (const id of txnIds) {
      const res = memoryImportStore.updateTransaction(id, finalUpdates);
      if (res) count++;
    }

    try {
      const supabase = await createClient();
      await supabase
        .from("imported_transactions")
        .update({ ...finalUpdates, updated_at: new Date().toISOString() })
        .in("id", txnIds)
        .eq("user_id", userId);
    } catch {
      // Fallback
    }

    // Refresh batch summary
    const all = await this.getBatchTransactions(batchId, userId);
    const newSummary = this.computeBatchSummary(all);
    const batch = await this.getBatch(batchId, userId);
    if (batch) {
      batch.summary = newSummary;
      batch.review_count = newSummary.needsReview;
      await this.persistBatch(batch);
    }

    return count;
  }

  /**
   * Confirm Import & Atomically create expenses
   * Section 49 & 54:
   * Only approved transactions of type 'expense' become canonical expense records.
   */
  async confirmImport(
    batchId: string,
    selectedTxnIds?: string[],
    userId?: string
  ): Promise<{
    importedCount: number;
    skippedCount: number;
    duplicateCount: number;
    createdExpenses: Expense[];
  }> {
    const targetUserId = userId || "default_user";
    const allTxns = await this.getBatchTransactions(batchId, targetUserId);
    const batch = await this.getBatch(batchId, targetUserId);

    if (!batch) {
      throw new Error(`Import batch ${batchId} not found.`);
    }

    // Filter which transactions to process:
    // If selectedTxnIds provided, use those; otherwise process all non-ignored transactions.
    const toProcess = allTxns.filter(t => {
      if (selectedTxnIds && selectedTxnIds.length > 0) {
        return selectedTxnIds.includes(t.id);
      }
      return (
        t.review_status !== "ignored" &&
        t.review_status !== "invalid"
      );
    });

    const createdExpenses: Expense[] = [];
    let skippedCount = 0;
    let duplicateCount = 0;

    for (const txn of toProcess) {
      // Non-expenses (transfers, income) are skipped from the expense table
      if (txn.transaction_type !== "expense") {
        skippedCount++;
        await this.updateTransaction(batchId, txn.id, { review_status: "accepted" }, targetUserId);
        continue;
      }

      if (txn.dedupe_status === "exact_duplicate" && !selectedTxnIds?.includes(txn.id)) {
        duplicateCount++;
        continue;
      }

      const category = txn.selected_category || txn.suggested_category || "Other";
      const expenseId = `exp_${crypto.randomUUID()}`;

      const expense: Expense = {
        id: expenseId,
        user_id: targetUserId,
        title: txn.merchant || txn.description.slice(0, 40),
        merchant: txn.merchant,
        category,
        amount: txn.amount,
        currency: txn.currency || "INR",
        date: txn.transaction_date,
        payment_method: batch.source_name || "Import",
        notes: `Imported from ${batch.source_name} (${batch.original_filename}) • Ref: ${txn.reference_id || "N/A"}`,
        source: "import",
        classification_confidence: txn.confidence_score,
        invoice_number: txn.reference_id
      };

      // 1. Create canonical expense
      await billService.createExpense(expense);
      createdExpenses.push(expense);

      // 2. Create expense_source reconciliation link
      const sourceRecord: ExpenseSource = {
        id: `src_${crypto.randomUUID()}`,
        expense_id: expenseId,
        user_id: targetUserId,
        import_batch_id: batchId,
        source_type: batch.source_type === "payment_app" ? "payment_app" : "bank_statement",
        source_name: batch.source_name,
        source_transaction_id: txn.reference_id,
        created_at: new Date().toISOString()
      };
      await this.persistExpenseSource(sourceRecord);

      // 3. Mark transaction staged row as accepted and link expense_id
      await this.updateTransaction(
        batchId,
        txn.id,
        {
          review_status: "accepted",
          expense_id: expenseId
        },
        targetUserId
      );
    }

    // Update batch status
    batch.created_expenses += createdExpenses.length;
    batch.status = createdExpenses.length > 0 ? "imported" : "partially_imported";
    batch.completed_at = new Date().toISOString();
    await this.persistBatch(batch);

    return {
      importedCount: createdExpenses.length,
      skippedCount,
      duplicateCount,
      createdExpenses
    };
  }

  /**
   * Reversible Undo Import (Section 55)
   * Safely deletes only the expenses created by this import batch, preserving manual expenses!
   */
  async undoImport(
    batchId: string,
    userId: string
  ): Promise<{ undoneCount: number }> {
    const batch = await this.getBatch(batchId, userId);
    if (!batch) {
      throw new Error(`Import batch ${batchId} not found.`);
    }

    // 1. Find all expense_sources tied to this batch
    const sources = memoryImportStore.listSources(userId).filter(s => s.import_batch_id === batchId);
    const expenseIdsToDelete = sources.map(s => s.expense_id);

    // Delete from memory store
    memoryImportStore.deleteSourcesByBatch(batchId);

    // Delete corresponding expenses via billService
    if (expenseIdsToDelete.length > 0) {
      await billService.deleteExpenses(expenseIdsToDelete, userId);
    }

    try {
      const supabase = await createClient();
      if (expenseIdsToDelete.length > 0) {
        await supabase.from("expense_sources").delete().eq("import_batch_id", batchId).eq("user_id", userId);
      }
    } catch {
      // Fallback
    }

    // 2. Unlink expense_id from staged transactions
    const txns = await this.getBatchTransactions(batchId, userId);
    for (const t of txns) {
      if (t.expense_id) {
        await this.updateTransaction(batchId, t.id, { expense_id: null, review_status: "pending" }, userId);
      }
    }

    // 3. Mark batch cancelled
    batch.status = "cancelled";
    batch.created_expenses = 0;
    await this.persistBatch(batch);

    return { undoneCount: expenseIdsToDelete.length };
  }

  /**
   * List all user import batches
   */
  async listUserBatches(userId: string): Promise<ImportBatch[]> {
    const list = memoryImportStore.listBatches(userId);
    if (list.length > 0) return list;

    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("import_batches")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (data && data.length > 0) return data as ImportBatch[];
    } catch {
      // Fallback
    }
    return [];
  }

  public async getUserExpenseSources(userId: string): Promise<ExpenseSource[]> {
    const list = memoryImportStore.listSources(userId);
    if (list.length > 0) return list;

    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("expense_sources")
        .select("*")
        .eq("user_id", userId);
      if (data) return data as ExpenseSource[];
    } catch {
      // Fallback
    }
    return [];
  }

  public async getUserMerchantAliases(userId: string): Promise<MerchantAlias[]> {
    try {
      const supabase = await createClient();
      const { data } = await supabase.from("merchant_aliases").select("*");
      if (data) return data as MerchantAlias[];
    } catch {
      // Fallback
    }
    return [];
  }

  private async persistBatch(batch: ImportBatch): Promise<void> {
    memoryImportStore.saveBatch(batch);
    try {
      const supabase = await createClient();
      await supabase.from("import_batches").upsert({
        id: batch.id,
        user_id: batch.user_id,
        source_type: batch.source_type,
        source_name: batch.source_name,
        original_filename: batch.original_filename,
        file_size: batch.file_size,
        file_hash: batch.file_hash,
        total_rows: batch.total_rows,
        processed_rows: batch.processed_rows,
        created_expenses: batch.created_expenses,
        review_count: batch.review_count,
        duplicate_count: batch.duplicate_count,
        failed_count: batch.failed_count,
        status: batch.status,
        summary: batch.summary,
        created_at: batch.created_at,
        completed_at: batch.completed_at
      });
    } catch {
      // Memory store preserves state
    }
  }

  private async persistTransactions(txns: ImportedTransaction[]): Promise<void> {
    memoryImportStore.saveTransactions(txns);
    try {
      const supabase = await createClient();
      const records = txns.map(t => ({
        id: t.id,
        import_batch_id: t.import_batch_id,
        user_id: t.user_id,
        transaction_date: t.transaction_date,
        value_date: t.value_date,
        description: t.description,
        merchant: t.merchant,
        amount: t.amount,
        currency: t.currency,
        direction: t.direction,
        transaction_type: t.transaction_type,
        reference_id: t.reference_id,
        suggested_category_id: t.suggested_category_id,
        suggested_category: t.suggested_category,
        confidence_score: t.confidence_score,
        confidence_level: t.confidence_level,
        dedupe_status: t.dedupe_status,
        dedupe_reason: t.dedupe_reason,
        review_status: t.review_status,
        selected_category: t.selected_category,
        expense_id: t.expense_id,
        raw_data: t.raw_data,
        created_at: t.created_at,
        updated_at: t.updated_at
      }));
      await supabase.from("imported_transactions").upsert(records);
    } catch {
      // Memory store preserves state
    }
  }

  private async persistExpenseSource(source: ExpenseSource): Promise<void> {
    memoryImportStore.saveExpenseSource(source);
    try {
      const supabase = await createClient();
      await supabase.from("expense_sources").insert(source);
    } catch {
      // Memory store preserves state
    }
  }
}

export const importService = new ImportService();
