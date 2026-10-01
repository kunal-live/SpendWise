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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-5">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-lg bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-400 border border-violet-500/20">
              {sourceName}
            </span>
            <span className="text-xs text-zinc-500 truncate max-w-xs">{filename}</span>
          </div>
          <h3 className="mt-1.5 text-lg font-bold text-zinc-200">
            {summary.totalTransactions} Transactions Detected
          </h3>
        </div>
        <div className="text-right sm:text-right">
          <div className="text-xs text-zinc-500">Detected Spending</div>
          <div className="text-2xl font-black text-violet-400">
            {money(summary.totalExpenseAmount)}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Receipt size={14} className="text-violet-400" /> Expenses
          </div>
          <div className="mt-1 text-xl font-bold text-zinc-200">{summary.expensesDetected}</div>
          <div className="text-[11px] text-zinc-500">{money(summary.totalExpenseAmount)}</div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <RefreshCw size={14} className="text-blue-400" /> Transfers
          </div>
          <div className="mt-1 text-xl font-bold text-zinc-200">{summary.transfersDetected}</div>
          <div className="text-[11px] text-zinc-500">Excluded from spend</div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <ArrowDownLeft size={14} className="text-emerald-400" /> Income &amp; Refunds
          </div>
          <div className="mt-1 text-xl font-bold text-zinc-200">
            {summary.incomeDetected + summary.refundsDetected}
          </div>
          <div className="text-[11px] text-zinc-500">
            {summary.incomeDetected} in, {summary.refundsDetected} ref
          </div>
        </div>

        <div className={`rounded-xl border p-3 ${
          summary.duplicatesDetected > 0 
            ? "border-amber-500/30 bg-amber-500/10 text-amber-300" 
            : "border-zinc-800/80 bg-zinc-900/40 text-zinc-400"
        }`}>
          <div className="flex items-center gap-1.5 text-xs">
            <AlertTriangle size={14} className={summary.duplicatesDetected > 0 ? "text-amber-400" : "text-zinc-500"} /> Duplicates
          </div>
          <div className="mt-1 text-xl font-bold text-zinc-200">{summary.duplicatesDetected}</div>
          <div className="text-[11px] text-zinc-500">
            {summary.duplicatesDetected > 0 ? "Flagged for safety" : "None detected"}
          </div>
        </div>
      </div>

      {/* Category Breakdown (Section 43) */}
      {summary.categoryBreakdown.length > 0 && (
        <div className="pt-2">
          <div className="text-xs font-semibold text-zinc-400 mb-2 flex items-center gap-1.5">
            <Layers size={13} /> Spending by Category Before Import:
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.categoryBreakdown.map((cat) => (
              <div 
                key={cat.category}
                className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs border border-zinc-800"
              >
                <span className="font-medium text-zinc-300">{cat.category}</span>
                <span className="text-zinc-500">({cat.count})</span>
                <span className="font-semibold text-violet-300">{money(cat.totalAmount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
