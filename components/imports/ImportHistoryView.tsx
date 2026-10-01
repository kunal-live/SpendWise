import React, { useState, useEffect } from "react";
import { ImportBatch } from "@/lib/types";
import { 
  Building, 
  Smartphone, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  UploadCloud, 
  Calendar, 
  Layers, 
  FileSpreadsheet,
  Trash2,
  Receipt
} from "lucide-react";

interface ImportHistoryViewProps {
  onOpenImportModal: () => void;
  showToast?: (message: string, type?: "success" | "warning" | "info") => void;
}

export default function ImportHistoryView({
  onOpenImportModal,
  showToast
}: ImportHistoryViewProps) {
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [undoTarget, setUndoTarget] = useState<ImportBatch | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);

  const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  const loadBatches = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/imports");
      const data = await res.json();
      if (data.batches) {
        setBatches(data.batches);
      }
    } catch {
      showToast?.("Failed to load statement import history.", "warning");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const handleUndoImport = async () => {
    if (!undoTarget) return;
    setIsUndoing(true);
    try {
      const res = await fetch(`/api/imports/${undoTarget.id}/undo`, {
        method: "POST"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to undo import.");

      showToast?.(data.message || `Reverted import batch. Removed ${data.undone_count} expenses.`, "success");
      setUndoTarget(null);
      await loadBatches();
    } catch (err: any) {
      showToast?.(err?.message || "Failed to undo import.", "warning");
    } finally {
      setIsUndoing(false);
    }
  };

  const totalImportedExpenses = batches.reduce((sum, b) => sum + (b.created_expenses || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-violet-500/20 bg-gradient-to-r from-violet-950/40 via-zinc-950 to-zinc-950 p-6 sm:p-8">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-400 border border-violet-500/20 mb-2">
            <FileSpreadsheet size={13} /> Automated Expense Ingestion
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-100">
            Statement &amp; History Imports
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-xl">
            Import monthly bank statements and payment app history. Categorizes debits, excludes transfers and income, and detects duplicates.
          </p>
        </div>

        <button
          onClick={onOpenImportModal}
          className="flex items-center justify-center gap-2 rounded-2xl bg-violet-500 px-6 py-3.5 text-sm font-bold text-white hover:bg-violet-400 transition-all shadow-lg shadow-violet-500/25 shrink-0"
        >
          <UploadCloud size={18} /> Import Statement
        </button>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
          <div className="text-xs text-zinc-500">Statements Processed</div>
          <div className="mt-2 text-2xl font-black text-zinc-200">{batches.length}</div>
          <div className="mt-1 text-[11px] text-zinc-500">Bank &amp; Payment files</div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
          <div className="text-xs text-zinc-500">Expenses Created</div>
          <div className="mt-2 text-2xl font-black text-emerald-400">{totalImportedExpenses}</div>
          <div className="mt-1 text-[11px] text-zinc-500">Reconciled into SpendWise</div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 col-span-2 sm:col-span-1">
          <div className="text-xs text-zinc-500">Reversibility</div>
          <div className="mt-2 text-2xl font-black text-violet-400">100% Safe</div>
          <div className="mt-1 text-[11px] text-zinc-500">Undo any statement anytime</div>
        </div>
      </div>

      {/* Batches List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-zinc-200">Imported Statements</h3>

        {loading ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-12 text-center text-xs text-zinc-500">
            Loading your statement import history...
          </div>
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/60 p-12 text-center space-y-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-violet-500/10 text-violet-400">
              <FileSpreadsheet size={32} />
            </div>
            <div>
              <h4 className="font-bold text-zinc-200">No statements imported yet</h4>
              <p className="mt-1 text-xs text-zinc-500 max-w-sm">
                Upload bank statements from HDFC, ICICI, SBI or exports from Google Pay and PhonePe to ingest months of expenses in seconds.
              </p>
            </div>
            <button
              onClick={onOpenImportModal}
              className="rounded-xl bg-violet-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-400 transition-all shadow-md shadow-violet-500/20"
            >
              Upload First Statement
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map((batch) => {
              const isPaymentApp = batch.source_type === "payment_app";
              const isCancelled = batch.status === "cancelled";
              const Icon = isPaymentApp ? Smartphone : Building;

              return (
                <div
                  key={batch.id}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border p-5 transition-all ${
                    isCancelled
                      ? "border-zinc-900 bg-zinc-950/40 opacity-60"
                      : "border-zinc-800 bg-zinc-950 hover:border-violet-500/30"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-900 text-violet-400 shrink-0 border border-zinc-800">
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-200 text-sm">{batch.source_name}</span>
                        <span className="text-xs text-zinc-500 truncate max-w-xs">{batch.original_filename}</span>
                        {isCancelled && (
                          <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-zinc-800 text-zinc-400">
                            Cancelled / Undone
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-zinc-400 flex flex-wrap items-center gap-3">
                        <span>Total: <strong>{batch.total_rows}</strong></span>
                        <span>Expenses created: <strong className="text-emerald-400">{batch.created_expenses}</strong></span>
                        <span>Duplicates: <strong>{batch.duplicate_count}</strong></span>
                        <span>Date: {new Date(batch.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center shrink-0">
                    {!isCancelled && batch.created_expenses > 0 && (
                      <button
                        onClick={() => setUndoTarget(batch)}
                        className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all"
                      >
                        <RotateCcw size={13} /> Undo Import
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Undo Confirmation Modal (Section 55) */}
      {undoTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setUndoTarget(null)} />
          <div className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/15 text-rose-400">
              <RotateCcw size={24} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-zinc-100">Undo Statement Import?</h3>
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                This will safely remove all <strong>{undoTarget.created_expenses}</strong> expenses created by{" "}
                <span className="text-zinc-200 font-semibold">{undoTarget.source_name} ({undoTarget.original_filename})</span>.
              </p>
              <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                ✓ Your manually added expenses and other statements will remain untouched.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setUndoTarget(null)}
                disabled={isUndoing}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUndoImport}
                disabled={isUndoing}
                className="flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-400 shadow-lg shadow-rose-500/25 disabled:opacity-50"
              >
                {isUndoing ? "Reverting..." : "Confirm Undo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
