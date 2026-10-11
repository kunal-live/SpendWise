import React, { useState } from "react";
import { ImportedTransaction, TransactionType } from "@/lib/types";
import { 
  Check, 
  X, 
  AlertTriangle, 
  ChevronDown, 
  Filter, 
  RefreshCw, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Receipt, 
  ShieldAlert,
  Edit2,
  Trash2,
  Sparkles
} from "lucide-react";

interface ImportReviewQueueProps {
  batchId: string;
  transactions: ImportedTransaction[];
  onUpdateTransaction: (txnId: string, updates: Partial<ImportedTransaction>) => Promise<void>;
  onBulkUpdate: (txnIds: string[], updates: Partial<ImportedTransaction>) => Promise<void>;
  onConfirmImport: (selectedTxnIds?: string[]) => Promise<void>;
  onCancel: () => void;
  isConfirming?: boolean;
}

const ALL_CATEGORIES = [
  "Food",
  "Groceries",
  "Shopping",
  "Clothing",
  "Electronics",
  "Transport",
  "Healthcare",
  "Entertainment",
  "Bills & Utilities",
  "Travel",
  "Education",
  "Subscriptions",
  "Invest",
  "Other"
];

export default function ImportReviewQueue({
  batchId,
  transactions,
  onUpdateTransaction,
  onBulkUpdate,
  onConfirmImport,
  onCancel,
  isConfirming = false
}: ImportReviewQueueProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "review" | "expenses" | "transfers" | "duplicates">("all");
  const [bulkCategory, setBulkCategory] = useState<string>("Food");
  const [showBulkCategoryMenu, setShowBulkCategoryMenu] = useState(false);
  const [search, setSearch] = useState("");

  const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  // Filtered transactions
  const filtered = transactions.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        (t.merchant || "").toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.reference_id || "").toLowerCase().includes(q);
      if (!match) return false;
    }

    if (activeTab === "review") {
      return t.review_status === "pending" || t.confidence_level === "low";
    }
    if (activeTab === "expenses") {
      return t.transaction_type === "expense";
    }
    if (activeTab === "transfers") {
      return t.transaction_type === "transfer" || t.transaction_type === "income" || t.transaction_type === "refund";
    }
    if (activeTab === "duplicates") {
      return t.dedupe_status !== "unique";
    }
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((t) => t.id));
    }
  };

  const handleBulkAssignCategory = async (cat: string) => {
    if (selectedIds.length === 0) return;
    await onBulkUpdate(selectedIds, { selected_category: cat, suggested_category: cat, review_status: "edited" });
    setShowBulkCategoryMenu(false);
  };

  const handleBulkMarkAsTransfer = async () => {
    if (selectedIds.length === 0) return;
    await onBulkUpdate(selectedIds, { transaction_type: "transfer", review_status: "edited" });
  };

  const handleBulkIgnore = async () => {
    if (selectedIds.length === 0) return;
    await onBulkUpdate(selectedIds, { review_status: "ignored" });
  };

  const handleBulkMarkAsExpense = async () => {
    if (selectedIds.length === 0) return;
    await onBulkUpdate(selectedIds, { transaction_type: "expense", review_status: "accepted" });
  };

  const readyToImportCount = transactions.filter(
    (t) => t.transaction_type === "expense" && t.review_status !== "ignored" && t.review_status !== "invalid"
  ).length;

  return (
    <div className="space-y-4">
      {/* Tab Navigation & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "all"
                ? "bg-[#E07A28] text-white shadow-md shadow-[#E07A28]/20"
                : "bg-[#26201B] text-[#8C8176] hover:text-[#F6F2EB] hover:bg-[#28211B]"
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab("review")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "review"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                : "bg-[#26201B] text-[#8C8176] hover:text-[#F6F2EB] hover:bg-[#28211B]"
            }`}
          >
            Needs Review ({transactions.filter((t) => t.review_status === "pending" || t.confidence_level === "low").length})
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "expenses"
                ? "bg-[#E07A28] text-white shadow-md shadow-[#E07A28]/20"
                : "bg-[#26201B] text-[#8C8176] hover:text-[#F6F2EB] hover:bg-[#28211B]"
            }`}
          >
            Expenses ({transactions.filter((t) => t.transaction_type === "expense").length})
          </button>
          <button
            onClick={() => setActiveTab("transfers")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "transfers"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-[#26201B] text-[#8C8176] hover:text-[#F6F2EB] hover:bg-[#28211B]"
            }`}
          >
            Transfers/Income ({transactions.filter((t) => t.transaction_type !== "expense").length})
          </button>
          <button
            onClick={() => setActiveTab("duplicates")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "duplicates"
                ? "bg-rose-600 text-white shadow-md shadow-rose-500/20"
                : "bg-[#26201B] text-[#8C8176] hover:text-[#F6F2EB] hover:bg-[#28211B]"
            }`}
          >
            Duplicates ({transactions.filter((t) => t.dedupe_status !== "unique").length})
          </button>
        </div>

        <input
          type="text"
          placeholder="Search merchant, reference, or narration..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl border border-[#382D25] bg-[#26201B] px-3 py-1.5 text-xs text-[#F6F2EB] placeholder-[#8C8176] outline-none focus:border-[#E07A28] focus:bg-[#1D1815] w-full sm:w-64 transition-all"
        />
      </div>

      {/* Floating / Sticky Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E07A28]/30 bg-[#1D1815] p-3 shadow-md animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-[#E07A28] text-xs font-bold text-white">
              {selectedIds.length}
            </span>
            <span className="text-xs font-medium text-[#F6F2EB]">transactions selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBulkCategoryMenu(!showBulkCategoryMenu)}
                className="flex items-center gap-1.5 rounded-lg border border-[#E07A28]/30 bg-[#26201B] px-3 py-1.5 text-xs font-semibold text-[#E07A28] hover:bg-[#28211B]"
              >
                Assign Category <ChevronDown size={13} />
              </button>
              {showBulkCategoryMenu && (
                <div className="absolute left-0 top-full z-30 mt-1 max-h-56 w-48 overflow-y-auto rounded-xl border border-[#382D25] bg-[#1D1815] p-1 shadow-2xl">
                  {ALL_CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleBulkAssignCategory(c)}
                      className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-[#C6BCB3] hover:bg-[#E07A28]/10 hover:text-[#E07A28]"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleBulkMarkAsTransfer}
              className="flex items-center gap-1.5 rounded-lg border border-[#382D25] bg-[#26201B] px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-[#28211B]"
            >
              <RefreshCw size={12} /> Mark as Transfer
            </button>

            <button
              onClick={handleBulkMarkAsExpense}
              className="flex items-center gap-1.5 rounded-lg border border-[#382D25] bg-[#26201B] px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-[#28211B]"
            >
              <Receipt size={12} /> Mark as Expense
            </button>

            <button
              onClick={handleBulkIgnore}
              className="flex items-center gap-1.5 rounded-lg border border-[#382D25] bg-[#26201B] px-3 py-1.5 text-xs font-semibold text-[#8C8176] hover:text-rose-700 hover:bg-rose-50"
            >
              <Trash2 size={12} /> Ignore Selected
            </button>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#382D25] bg-[#1D1815] shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#382D25] bg-[#26201B] text-[11px] font-semibold text-[#8C8176]">
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedIds.length === filtered.length}
                  onChange={selectAll}
                  className="rounded border-[#382D25] text-[#E07A28] focus:ring-0"
                />
              </th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Merchant / Narration</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Amount</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Confidence</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#382D25] text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#8C8176]">
                  No transactions match the selected filter.
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const isSelected = selectedIds.includes(t.id);
                const isExpense = t.transaction_type === "expense";
                const isTransfer = t.transaction_type === "transfer";
                const isIncome = t.transaction_type === "income";
                const isRefund = t.transaction_type === "refund";
                const isDuplicate = t.dedupe_status !== "unique";
                const isIgnored = t.review_status === "ignored";

                return (
                  <tr
                    key={t.id}
                    className={`transition-colors ${
                      isIgnored
                        ? "opacity-40 bg-[#26201B]"
                        : isSelected
                        ? "bg-[#E07A28]/10"
                        : "hover:bg-[#28211B]/70"
                    }`}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(t.id)}
                        className="rounded border-[#382D25] text-[#E07A28] focus:ring-0"
                      />
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-[#8C8176] font-mono text-[11px]">
                      {t.transaction_date}
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-semibold text-[#F6F2EB] flex items-center gap-1.5">
                        <span className="truncate">{t.merchant || t.description}</span>
                        {isDuplicate && (
                          <span 
                            title={t.dedupe_reason || "Possible duplicate detected"}
                            className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-800 border border-amber-500/30"
                          >
                            <AlertTriangle size={10} /> Duplicate
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#8C8176] truncate" title={t.description}>
                        {t.description}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <select
                        value={t.transaction_type}
                        onChange={(e) =>
                          onUpdateTransaction(t.id, {
                            transaction_type: e.target.value as TransactionType,
                            review_status: "edited"
                          })
                        }
                        className={`rounded-lg border px-2 py-1 text-[11px] font-medium outline-none ${
                          isExpense
                            ? "border-[#E07A28]/30 bg-[#E07A28]/10 text-[#E07A28]"
                            : isTransfer
                            ? "border-blue-500/30 bg-blue-500/10 text-blue-700"
                            : isIncome
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                            : "border-[#382D25] bg-[#26201B] text-[#C6BCB3]"
                        }`}
                      >
                        <option value="expense">Expense</option>
                        <option value="transfer">Transfer</option>
                        <option value="income">Income</option>
                        <option value="refund">Refund</option>
                        <option value="cash_withdrawal">Cash WDL</option>
                        <option value="fee">Bank Fee</option>
                        <option value="investment">Investment</option>
                        <option value="card_payment">Credit Card</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className={`font-bold ${t.direction === "credit" ? "text-emerald-700" : "text-[#F6F2EB]"}`}>
                        {t.direction === "credit" ? "+" : ""}{money(t.amount)}
                      </div>
                      <div className="text-[10px] text-[#8C8176] uppercase">{t.direction}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {isExpense ? (
                        <select
                          value={t.selected_category || t.suggested_category || "Other"}
                          onChange={(e) =>
                            onUpdateTransaction(t.id, {
                              selected_category: e.target.value,
                              suggested_category: e.target.value,
                              review_status: "edited"
                            })
                          }
                          className="rounded-lg border border-[#382D25] bg-[#26201B] px-2 py-1 text-[11px] text-[#F6F2EB] outline-none focus:border-[#E07A28]"
                        >
                          {ALL_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[11px] text-[#8C8176] italic">Excluded from spend</span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            t.confidence_score >= 0.90
                              ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                              : t.confidence_score >= 0.70
                              ? "bg-amber-500 shadow-sm shadow-amber-500/50"
                              : "bg-rose-500 shadow-sm shadow-rose-500/50"
                          }`}
                        />
                        <span className="text-[11px] font-mono text-[#8C8176]">
                          {Math.round(t.confidence_score * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      {isIgnored ? (
                        <button
                          onClick={() => onUpdateTransaction(t.id, { review_status: "pending" })}
                          className="text-[11px] text-[#8C8176] hover:text-[#F6F2EB]"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateTransaction(t.id, { review_status: "ignored" })}
                          className="text-[11px] text-[#8C8176] hover:text-rose-600 transition-colors"
                        >
                          Ignore
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation & Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-[#382D25]">
        <div className="text-xs text-[#8C8176]">
          Ready to import <strong className="text-emerald-700">{readyToImportCount}</strong> expense records.
          Transfers and income will be excluded from spending analytics.
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-[#382D25] bg-[#26201B] px-4 py-2.5 text-xs font-semibold text-[#F6F2EB] hover:bg-[#28211B] transition-colors"
          >
            Cancel / Save Draft
          </button>
          <button
            onClick={() => onConfirmImport(selectedIds.length > 0 ? selectedIds : undefined)}
            disabled={isConfirming || readyToImportCount === 0}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E07A28] to-[#C25B15] px-5 py-2.5 text-xs font-bold text-white hover:brightness-105 transition-all shadow-lg shadow-[#E07A28]/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfirming ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Importing...
              </>
            ) : (
              <>
                <Check size={14} />
                {selectedIds.length > 0
                  ? `Import Selected (${selectedIds.length})`
                  : `Confirm & Import ${readyToImportCount} Expenses`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
