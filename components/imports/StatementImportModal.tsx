import React, { useState, useRef } from "react";
import { ImportBatch, ImportedTransaction, Expense } from "@/lib/types";
import { 
  X, 
  UploadCloud, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles,
  CreditCard,
  Building,
  Smartphone
} from "lucide-react";
import ImportSummaryCard from "./ImportSummaryCard";
import ImportReviewQueue from "./ImportReviewQueue";

export interface StatementImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportConfirmed?: (importedCount: number, createdExpenses?: Expense[]) => void;
  showToast?: (message: string, type?: "success" | "warning" | "info") => void;
}

const SOURCES = [
  { id: "auto", name: "Auto Detect", icon: Sparkles },
  { id: "Google Pay", name: "Google Pay", icon: Smartphone },
  { id: "PhonePe", name: "PhonePe", icon: Smartphone },
  { id: "Paytm", name: "Paytm", icon: Smartphone },
  { id: "HDFC Bank", name: "HDFC Bank", icon: Building },
  { id: "ICICI Bank", name: "ICICI Bank", icon: Building },
  { id: "SBI", name: "SBI", icon: Building },
  { id: "Axis Bank", name: "Axis Bank", icon: Building }
];

export default function StatementImportModal({
  isOpen,
  onClose,
  onImportConfirmed,
  showToast
}: StatementImportModalProps) {
  const [selectedSource, setSelectedSource] = useState("auto");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Staged Result State
  const [currentBatch, setCurrentBatch] = useState<ImportBatch | null>(null);
  const [transactions, setTransactions] = useState<ImportedTransaction[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getActiveUserId = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("spendwise_active_user") || "Guest User";
    }
    return "Guest User";
  };

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectFile = (f: File) => {
    const ext = f.name.toLowerCase().split(".").pop() || "";
    const allowed = ["csv", "pdf", "tsv", "txt", "xlsx"];
    if (!allowed.includes(ext)) {
      setError(`Unsupported file type: .${ext}. Please upload a CSV, PDF, TSV, or XLSX statement.`);
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      setError("File exceeds 15MB limit.");
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleUploadAndProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setProcessingStage("Validating statement file...");

    try {
      const activeUser = getActiveUserId();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source", selectedSource);

      setProcessingStage("Extracting and parsing transactions...");
      const res = await fetch("/api/imports", {
        method: "POST",
        headers: {
          "x-user-id": activeUser
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process statement.");
      }

      setProcessingStage("Classifying categories & checking duplicates...");

      // Fetch review transactions
      const reviewRes = await fetch(`/api/imports/${data.import_id}/review`, {
        headers: {
          "x-user-id": activeUser
        }
      });
      const reviewData = await reviewRes.json();

      setCurrentBatch(data.batch);
      setTransactions(reviewData.transactions || []);
      setIsProcessing(false);
      showToast?.(`Extracted ${data.total_rows} transactions successfully!`, "success");
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || "An error occurred during statement processing.");
    }
  };

  const handleUpdateTransaction = async (txnId: string, updates: Partial<ImportedTransaction>) => {
    if (!currentBatch) return;
    try {
      const activeUser = getActiveUserId();
      const res = await fetch(`/api/imports/${currentBatch.id}/transactions/${txnId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": activeUser
        },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success && data.transaction) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === txnId ? { ...t, ...data.transaction } : t))
        );
      }
    } catch (err) {
      showToast?.("Failed to update transaction.", "warning");
    }
  };

  const handleBulkUpdate = async (txnIds: string[], updates: Partial<ImportedTransaction>) => {
    if (!currentBatch) return;
    try {
      const activeUser = getActiveUserId();
      const res = await fetch(`/api/imports/${currentBatch.id}/bulk`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": activeUser
        },
        body: JSON.stringify({ transaction_ids: txnIds, ...updates })
      });
      const data = await res.json();
      if (data.success) {
        setTransactions((prev) =>
          prev.map((t) => (txnIds.includes(t.id) ? { ...t, ...updates } : t))
        );
        showToast?.(`Updated ${data.modified_count} transactions`, "success");
      }
    } catch {
      showToast?.("Failed to bulk update transactions.", "warning");
    }
  };

  const handleConfirmImport = async (selectedTxnIds?: string[]) => {
    if (!currentBatch) return;
    setIsConfirming(true);
    try {
      const activeUser = getActiveUserId();
      const res = await fetch(`/api/imports/${currentBatch.id}/confirm`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": activeUser
        },
        body: JSON.stringify({ transaction_ids: selectedTxnIds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm import.");

      setIsConfirming(false);
      showToast?.(`Successfully imported ${data.imported} expenses!`, "success");
      onImportConfirmed?.(data.imported, data.created_expenses);
      handleReset();
      onClose();
    } catch (err: any) {
      setIsConfirming(false);
      showToast?.(err?.message || "Failed to confirm expenses.", "warning");
    }
  };

  const handleReset = () => {
    setFile(null);
    setCurrentBatch(null);
    setTransactions([]);
    setError(null);
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          if (!isProcessing && !isConfirming) {
            handleReset();
            onClose();
          }
        }}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-5xl rounded-3xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 sm:p-8 shadow-2xl z-10 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5DFD3] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#FF6B4A]/10 text-[#FF6B4A]">
                <UploadCloud size={16} />
              </span>
              <h2 className="text-xl font-black tracking-tight text-[#14151A]">
                {currentBatch ? "Review & Confirm Statement" : "Import Statement or History"}
              </h2>
            </div>
            <p className="mt-1 text-xs text-[#7A756D]">
              {currentBatch 
                ? "Review detected transactions, adjust categories, and confirm expenses."
                : "Upload bank statements (PDF/CSV) or payment app exports (Google Pay, PhonePe, Paytm)."}
            </p>
          </div>

          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            disabled={isProcessing || isConfirming}
            className="rounded-full p-2 text-[#7A756D] hover:bg-[#F4EFE6] hover:text-[#14151A] disabled:opacity-40 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!currentBatch ? (
            // Upload Screen
            <div className="space-y-6">
              {/* Source Selection */}
              <div>
                <label className="text-xs font-semibold text-[#7A756D] block mb-2">
                  Select Statement / History Source
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SOURCES.map((s) => {
                    const Icon = s.icon;
                    const isSelected = selectedSource === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSource(s.id)}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition-all text-left ${
                          isSelected
                            ? "border-[#FF6B4A] bg-[#FF6B4A]/10 text-[#FF6B4A] shadow-sm"
                            : "border-[#E5DFD3] bg-[#F4EFE6] text-[#45423E] hover:border-[#FF6B4A]/40 hover:bg-[#FFFDF9] hover:text-[#14151A]"
                        }`}
                      >
                        <Icon size={14} className={isSelected ? "text-[#FF6B4A]" : "text-[#7A756D]"} />
                        <span className="truncate">{s.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-[#FF6B4A] bg-[#FF6B4A]/10"
                    : file
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-[#E5DFD3] bg-[#F4EFE6] hover:border-[#FF6B4A]/40 hover:bg-[#FFFDF9]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.pdf,.tsv,.txt,.xlsx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleSelectFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#FF6B4A]/10 text-[#FF6B4A] mb-4">
                  {file ? <FileText size={32} className="text-emerald-600" /> : <UploadCloud size={32} />}
                </div>

                {file ? (
                  <div>
                    <p className="text-sm font-bold text-[#14151A]">{file.name}</p>
                    <p className="text-xs text-[#7A756D] mt-1">
                      {(file.size / 1024).toFixed(1)} KB • Click or drop another file to replace
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-bold text-[#14151A]">
                      Drop statement file here or <span className="text-[#FF6B4A] underline font-bold">browse</span>
                    </p>
                    <p className="text-xs text-[#7A756D] mt-1">
                      Supports Bank PDF, CSV, TSV, or XLSX statement exports (max 15MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Process Button / Progress */}
              {isProcessing ? (
                <div className="rounded-2xl border border-[#FF6B4A]/30 bg-[#FF6B4A]/10 p-6 text-center space-y-3">
                  <RefreshCw size={24} className="animate-spin text-[#FF6B4A] mx-auto" />
                  <p className="text-sm font-semibold text-[#14151A]">{processingStage}</p>
                  <p className="text-xs text-[#7A756D]">
                    Applying debit/credit rules, merchant aliases, and expense categories...
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!file}
                  onClick={handleUploadAndProcess}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#FF6B4A] to-[#FF5733] py-3.5 text-sm font-bold text-white hover:brightness-105 transition-all shadow-lg shadow-[#FF6B4A]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Parse &amp; Review Statement
                </button>
              )}
            </div>
          ) : (
            // Review Screen
            <div className="space-y-6">
              <ImportSummaryCard
                sourceName={currentBatch.source_name}
                filename={currentBatch.original_filename}
                summary={currentBatch.summary}
              />

              <ImportReviewQueue
                batchId={currentBatch.id}
                transactions={transactions}
                onUpdateTransaction={handleUpdateTransaction}
                onBulkUpdate={handleBulkUpdate}
                onConfirmImport={handleConfirmImport}
                onCancel={handleReset}
                isConfirming={isConfirming}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
