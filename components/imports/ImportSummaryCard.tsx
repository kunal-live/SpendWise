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
    <div className="rounded-2xl border border-[#382D25] bg-[#1D1815] p-5 space-y-5">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#382D25]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-lg bg-[#E07A28]/10 px-2.5 py-1 text-xs font-semibold text-[#E07A28] border border-[#E07A28]/20">
              {sourceName}
            </span>
            <span className="text-xs text-[#8C8176] truncate max-w-xs">{filename}</span>
          </div>
          <h3 className="mt-1.5 text-lg font-bold text-[#F6F2EB]">
            {summary.totalTransactions} Transactions Detected
          </h3>
        </div>
        <div className="text-right sm:text-right">
          <div className="text-xs text-[#8C8176]">Detected Spending</div>
          <div className="text-2xl font-black text-[#E07A28]">
            {money(summary.totalExpenseAmount)}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[#382D25] bg-[#26201B] p-3">
          <div className="flex items-center gap-1.5 text-xs text-[#8C8176]">
            <Receipt size={14} className="text-[#E07A28]" /> Expenses
          </div>
          <div className="mt-1 text-xl font-bold text-[#F6F2EB]">{summary.expensesDetected}</div>
          <div className="text-[11px] text-[#8C8176]">{money(summary.totalExpenseAmount)}</div>
        </div>

        <div className="rounded-xl border border-[#382D25] bg-[#26201B] p-3">
          <div className="flex items-center gap-1.5 text-xs text-[#8C8176]">
            <RefreshCw size={14} className="text-blue-500" /> Transfers
          </div>
          <div className="mt-1 text-xl font-bold text-[#F6F2EB]">{summary.transfersDetected}</div>
          <div className="text-[11px] text-[#8C8176]">Excluded from spend</div>
        </div>

        <div className="rounded-xl border border-[#382D25] bg-[#26201B] p-3">
          <div className="flex items-center gap-1.5 text-xs text-[#8C8176]">
            <ArrowDownLeft size={14} className="text-emerald-600" /> Income &amp; Refunds
          </div>
          <div className="mt-1 text-xl font-bold text-[#F6F2EB]">
            {summary.incomeDetected + summary.refundsDetected}
          </div>
          <div className="text-[11px] text-[#8C8176]">
            {summary.incomeDetected} in, {summary.refundsDetected} ref
          </div>
        </div>

        <div className={`rounded-xl border p-3 ${
          summary.duplicatesDetected > 0 
            ? "border-amber-500/30 bg-amber-500/10 text-amber-900" 
            : "border-[#382D25] bg-[#26201B] text-[#8C8176]"
        }`}>
          <div className="flex items-center gap-1.5 text-xs">
            <AlertTriangle size={14} className={summary.duplicatesDetected > 0 ? "text-amber-600" : "text-[#8C8176]"} /> Duplicates
          </div>
          <div className="mt-1 text-xl font-bold text-[#F6F2EB]">{summary.duplicatesDetected}</div>
          <div className="text-[11px] text-[#8C8176]">
            {summary.duplicatesDetected > 0 ? "Flagged for safety" : "None detected"}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {summary.categoryBreakdown.length > 0 && (
        <div className="pt-2">
          <div className="text-xs font-semibold text-[#8C8176] mb-2 flex items-center gap-1.5">
            <Layers size={13} /> Spending by Category Before Import:
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.categoryBreakdown.map((cat) => (
              <div 
                key={cat.category}
                className="flex items-center gap-2 rounded-lg bg-[#26201B] px-3 py-1.5 text-xs border border-[#382D25]"
              >
                <span className="font-medium text-[#F6F2EB]">{cat.category}</span>
                <span className="text-[#8C8176]">({cat.count})</span>
                <span className="font-semibold text-[#E07A28]">{money(cat.totalAmount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
