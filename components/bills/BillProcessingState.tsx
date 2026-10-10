import { Loader2, CheckCircle2, ScanLine, FileSpreadsheet, Sparkles, ShieldCheck } from "lucide-react";

export interface ProcessingStep {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const STEPS: ProcessingStep[] = [
  {
    id: "upload",
    label: "File Upload",
    description: "Validating file format and uploading securely",
    icon: ShieldCheck
  },
  {
    id: "ocr",
    label: "OCR Processing",
    description: "Scanning document lines and visual layout",
    icon: ScanLine
  },
  {
    id: "extraction",
    label: "Information Extraction",
    description: "Detecting merchant, total, date, and line items",
    icon: FileSpreadsheet
  },
  {
    id: "classification",
    label: "Category Classification",
    description: "Applying item keywords and merchant intelligence",
    icon: Sparkles
  }
];

export interface BillProcessingStateProps {
  currentStage: "upload" | "ocr" | "extraction" | "classification" | "done";
  error?: string | null;
}

export default function BillProcessingState({
  currentStage,
  error
}: BillProcessingStateProps) {
  const stageOrder = ["upload", "ocr", "extraction", "classification", "done"];
  const currentIndex = stageOrder.indexOf(currentStage);

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-[#FF6B4A]/20 blur-xl animate-pulse" />
        <div className="relative grid h-16 w-16 place-items-center rounded-2xl border border-[#FF6B4A]/30 bg-[#FFFDF9] text-[#FF6B4A] shadow-xl">
          <Loader2 size={32} className="animate-spin text-[#FF6B4A]" />
        </div>
      </div>

      <h3 className="text-lg font-black tracking-tight text-[#14151A]">
        Processing Your Bill
      </h3>
      <p className="mt-1 text-xs text-[#7A756D] max-w-xs">
        Automating extraction and classification. Your expense will be ready for review in moments.
      </p>

      <div className="mt-8 w-full max-w-sm space-y-3 text-left">
        {STEPS.map((step, idx) => {
          const isDone = currentIndex > idx;
          const isCurrent = currentIndex === idx;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 rounded-2xl border p-3.5 transition-all ${
                isCurrent
                  ? "border-[#FF6B4A]/50 bg-[#FF6B4A]/10 shadow-lg shadow-[#FF6B4A]/10"
                  : isDone
                  ? "border-emerald-500/30 bg-emerald-500/10 text-[#45423E]"
                  : "border-[#E5DFD3] bg-[#F4EFE6] text-[#7A756D] opacity-75"
              }`}
            >
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-colors ${
                  isDone
                    ? "bg-emerald-500/20 text-emerald-600"
                    : isCurrent
                    ? "bg-[#FF6B4A]/20 text-[#FF6B4A]"
                    : "bg-[#EAE4D7] text-[#7A756D]"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 size={16} />
                ) : isCurrent ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Icon size={16} />
                )}
              </div>

              <div className="min-w-0">
                <div
                  className={`text-xs font-bold ${
                    isCurrent
                      ? "text-[#FF6B4A]"
                      : isDone
                      ? "text-emerald-800"
                      : "text-[#45423E]"
                  }`}
                >
                  {step.label}
                </div>
                <div className="text-[11px] text-[#7A756D] truncate">
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-5 text-xs text-rose-700 bg-rose-500/10 border border-rose-500/25 px-4 py-2.5 rounded-xl">
          {error}
        </div>
      )}
    </div>
  );
}
