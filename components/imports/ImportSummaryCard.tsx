import React from "react";
import { ImportBatchSummary } from "@/lib/types";
import { 
  CheckCircle2, 
  AlertTriangle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCw, 
  Layers, 
  Receipt,
  HelpCircle
} from "lucide-react";

interface ImportSummaryCardProps {
  sourceName: string;
  filename: string;
  summary: ImportBatchSummary;
}

export default function ImportSummaryCard({
  sourceName,
  filename,
  summary
}: ImportSummaryCardProps) {
  const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  return (
    <div className="rounded-2xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 space-y-5">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#E5DFD3]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-lg bg-[#FF6B4A]/10 px-2.5 py-1 text-xs font-semibold text-[#FF6B4A] border border-[#FF6B4A]/20">
              {sourceName}
            </span>
            <span className="text-xs text-[#7A756D] truncate max-w-xs">{filename}</span>
          </div>
          <h3 className="mt-1.5 text-lg font-bold text-[#14151A]">
            {summary.totalTransactions} Transactions Detected
          </h3>
        </div>
        <div className="text-right sm:text-right">
          <div className="text-xs text-[#7A756D]">Detected Spending</div>
          <div className="text-2xl font-black text-[#FF6B4A]">
            {money(summary.totalExpenseAmount)}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[#E5DFD3] bg-[#F4EFE6] p-3">
          <div className="flex items-center gap-1.5 text-xs text-[#7A756D]">
            <Receipt size={14} className="text-[#FF6B4A]" /> Expenses
          </div>
          <div className="mt-1 text-xl font-bold text-[#14151A]">{summary.expensesDetected}</div>
          <div className="text-[11px] text-[#7A756D]">{money(summary.totalExpenseAmount)}</div>
        </div>

        <div className="rounded-xl border border-[#E5DFD3] bg-[#F4EFE6] p-3">
          <div className="flex items-center gap-1.5 text-xs text-[#7A756D]">
            <RefreshCw size={14} className="text-blue-500" /> Transfers
          </div>
          <div className="mt-1 text-xl font-bold text-[#14151A]">{summary.transfersDetected}</div>
          <div className="text-[11px] text-[#7A756D]">Excluded from spend</div>
        </div>

        <div className="rounded-xl border border-[#E5DFD3] bg-[#F4EFE6] p-3">
          <div className="flex items-center gap-1.5 text-xs text-[#7A756D]">
            <ArrowDownLeft size={14} className="text-emerald-600" /> Income &amp; Refunds
          </div>
          <div className="mt-1 text-xl font-bold text-[#14151A]">
            {summary.incomeDetected + summary.refundsDetected}
          </div>
          <div className="text-[11px] text-[#7A756D]">
            {summary.incomeDetected} in, {summary.refundsDetected} ref
          </div>
        </div>

        <div className={`rounded-xl border p-3 ${
          summary.duplicatesDetected > 0 
            ? "border-amber-500/30 bg-amber-500/10 text-amber-900" 
            : "border-[#E5DFD3] bg-[#F4EFE6] text-[#7A756D]"
        }`}>
          <div className="flex items-center gap-1.5 text-xs">
            <AlertTriangle size={14} className={summary.duplicatesDetected > 0 ? "text-amber-600" : "text-[#7A756D]"} /> Duplicates
          </div>
          <div className="mt-1 text-xl font-bold text-[#14151A]">{summary.duplicatesDetected}</div>
          <div className="text-[11px] text-[#7A756D]">
            {summary.duplicatesDetected > 0 ? "Flagged for safety" : "None detected"}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {summary.categoryBreakdown.length > 0 && (
        <div className="pt-2">
          <div className="text-xs font-semibold text-[#7A756D] mb-2 flex items-center gap-1.5">
            <Layers size={13} /> Spending by Category Before Import:
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.categoryBreakdown.map((cat) => (
              <div 
                key={cat.category}
                className="flex items-center gap-2 rounded-lg bg-[#F4EFE6] px-3 py-1.5 text-xs border border-[#E5DFD3]"
              >
                <span className="font-medium text-[#14151A]">{cat.category}</span>
                <span className="text-[#7A756D]">({cat.count})</span>
                <span className="font-semibold text-[#FF6B4A]">{money(cat.totalAmount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
