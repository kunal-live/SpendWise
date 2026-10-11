import { AlertTriangle, ArrowRight, Check } from "lucide-react";

export interface DuplicateWarningProps {
  message: string;
  details?: {
    merchant: string;
    amount: number;
    date: string;
    invoice_number?: string;
  };
  onViewExisting?: () => void;
  onProceedAnyway: () => void;
  onCancel?: () => void;
}

export default function DuplicateWarningBanner({
  message,
  details,
  onViewExisting,
  onProceedAnyway,
  onCancel
}: DuplicateWarningProps) {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-900">
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-600">
          <AlertTriangle size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-amber-950 text-sm">Possible Duplicate Detected</div>
          <p className="mt-1 text-xs text-amber-900 leading-relaxed">
            {message}
          </p>
          {details && (
            <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-amber-950 bg-[#1D1815]/80 p-2.5 rounded-xl border border-amber-500/25">
              <span><strong>Merchant:</strong> {details.merchant}</span>
              <span>•</span>
              <span><strong>Amount:</strong> ₹{details.amount.toLocaleString("en-IN")}</span>
              <span>•</span>
              <span><strong>Date:</strong> {details.date}</span>
              {details.invoice_number && (
                <>
                  <span>•</span>
                  <span><strong>Inv #:</strong> {details.invoice_number}</span>
                </>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onProceedAnyway}
              className="rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 px-3.5 py-1.5 text-xs font-bold text-amber-950 transition-colors"
            >
              Add Anyway
            </button>
            {onViewExisting && (
              <button
                type="button"
                onClick={onViewExisting}
                className="rounded-xl bg-[#26201B] border border-[#382D25] hover:bg-[#28211B] px-3.5 py-1.5 text-xs font-semibold text-[#F6F2EB] transition-colors"
              >
                View Existing
              </button>
            )}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-[#8C8176] hover:text-[#F6F2EB] transition-colors"
              >
                Cancel Upload
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
