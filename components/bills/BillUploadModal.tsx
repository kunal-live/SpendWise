"use client";

import { useState } from "react";
import { X, Sparkles, AlertCircle, ArrowLeft } from "lucide-react";
import FileDropzone from "./FileDropzone";
import BillProcessingState from "./BillProcessingState";
import BillPreview from "./BillPreview";
import ExtractedBillForm from "./ExtractedBillForm";
import DuplicateWarningBanner from "./DuplicateWarningBanner";
import { ExtractedBillData, Expense } from "@/lib/types";

export interface BillUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseCreated: (expense: Expense) => void;
  showToast: (message: string, type?: "success" | "info" | "warning") => void;
}

type ModalStep = "dropzone" | "processing" | "duplicate_warning" | "review";

export default function BillUploadModal({
  isOpen,
  onClose,
  onExpenseCreated,
  showToast
}: BillUploadModalProps) {
  const [step, setStep] = useState<ModalStep>("dropzone");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStage, setProcessingStage] = useState<"upload" | "ocr" | "extraction" | "classification" | "done">("upload");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [billId, setBillId] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedBillData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  function resetState() {
    setStep("dropzone");
    setSelectedFile(null);
    setProcessingStage("upload");
    setErrorMessage(null);
    setBillId(null);
    setExtractedData(null);
    setIsSubmitting(false);
  }

  function handleClose() {
    resetState();
    onClose();
  }

  async function handleStartProcessing(file: File, forceDuplicate: boolean = false) {
    setErrorMessage(null);
    setStep("processing");
    setProcessingStage("upload");

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (forceDuplicate) {
        formData.append("forceDuplicate", "true");
      }

      // Simulated progressive pipeline animation for premium feel
      const stageTimer1 = setTimeout(() => setProcessingStage("ocr"), 400);
      const stageTimer2 = setTimeout(() => setProcessingStage("extraction"), 800);
      const stageTimer3 = setTimeout(() => setProcessingStage("classification"), 1200);

      const response = await fetch("/api/bills", {
        method: "POST",
        body: formData
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process bill.");
      }

      setProcessingStage("done");
      setBillId(result.bill_id);

      const extracted: ExtractedBillData = {
        merchant: result.merchant,
        total: result.amount,
        currency: result.currency || "INR",
        transaction_date: result.transaction_date,
        payment_method: result.payment_method || "UPI",
        suggested_category: result.suggested_category || "Other",
        confidence: result.confidence || 0.8,
        confidence_level: result.confidence_level || "medium",
        classification_reason: result.classification_reason,
        invoice_number: result.invoice_number,
        items: result.items || [],
        subtotal: result.subtotal,
        tax: result.tax,
        discount: result.discount,
        missing_fields: result.missing_fields,
        possible_duplicate: result.possible_duplicate
      };

      setExtractedData(extracted);

      // Check if duplicate detected and not forced
      if (extracted.possible_duplicate?.is_duplicate && !forceDuplicate) {
        setStep("duplicate_warning");
      } else {
        setStep("review");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to process document. Please try again with a clearer image or PDF.");
      setStep("dropzone");
    }
  }

  async function handleConfirmExpense(finalData: ExtractedBillData) {
    if (!billId) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/bills/${billId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: finalData.merchant,
          amount: finalData.total,
          currency: finalData.currency,
          category: finalData.suggested_category,
          transaction_date: finalData.transaction_date,
          payment_method: finalData.payment_method,
          invoice_number: finalData.invoice_number,
          items: finalData.items,
          notes: `Uploaded bill (${selectedFile?.name || "receipt"})`
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to confirm expense.");
      }

      // Successfully confirmed expense
      showToast(`Expense for ₹${finalData.total.toLocaleString("en-IN")} (${finalData.merchant}) added successfully!`, "success");
      onExpenseCreated(result.expense);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to save expense. Please retry.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8">
        <div
          className={`relative w-full overflow-hidden rounded-3xl border border-zinc-800 bg-[#0d0b12] shadow-2xl transition-all ${
            step === "review" ? "max-w-5xl" : "max-w-xl"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4">
            <div className="flex items-center gap-3">
              {step === "review" && (
                <button
                  type="button"
                  onClick={() => setStep("dropzone")}
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-white transition-colors"
                  title="Upload another file"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-violet-400 font-bold">
                  <Sparkles size={13} />
                  SpendWise Bill Scan
                </div>
                <h2 className="mt-0.5 text-lg font-black text-white">
                  {step === "dropzone" && "Upload Bill or Receipt"}
                  {step === "processing" && "Analyzing Document"}
                  {step === "duplicate_warning" && "Duplicate Detection"}
                  {step === "review" && "Review Bill & Confirm Expense"}
                </h2>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-900 hover:text-white transition-colors"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            {errorMessage && (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {step === "dropzone" && (
              <div className="space-y-6">
                <FileDropzone
                  selectedFile={selectedFile}
                  onFileSelect={(file) => setSelectedFile(file)}
                  onClear={() => setSelectedFile(null)}
                />

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!selectedFile}
                    onClick={() => selectedFile && handleStartProcessing(selectedFile)}
                    className="flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-400 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
                  >
                    <Sparkles size={14} />
                    Extract & Categorize
                  </button>
                </div>
              </div>
            )}

            {step === "processing" && (
              <BillProcessingState currentStage={processingStage} error={errorMessage} />
            )}

            {step === "duplicate_warning" && extractedData?.possible_duplicate && (
              <div className="space-y-6 py-2">
                <DuplicateWarningBanner
                  message={extractedData.possible_duplicate.message}
                  details={extractedData.possible_duplicate.details}
                  onProceedAnyway={() => setStep("review")}
                  onCancel={handleClose}
                />
              </div>
            )}

            {step === "review" && extractedData && (
              <div className="grid gap-6 lg:grid-cols-12">
                {/* Left Column: Bill Document Preview */}
                <div className="lg:col-span-5 h-[420px] lg:h-[540px]">
                  <BillPreview
                    billId={billId || undefined}
                    file={selectedFile}
                    mimeType={selectedFile?.type}
                    filename={selectedFile?.name}
                  />
                </div>

                {/* Right Column: Editable Form */}
                <div className="lg:col-span-7 flex flex-col">
                  <ExtractedBillForm
                    initialData={extractedData}
                    onConfirm={handleConfirmExpense}
                    onCancel={handleClose}
                    isSubmitting={isSubmitting}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
