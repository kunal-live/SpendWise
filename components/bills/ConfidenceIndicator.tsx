import { ShieldCheck, AlertTriangle, AlertCircle, HelpCircle } from "lucide-react";

export interface ConfidenceIndicatorProps {
  confidence: number; // 0.0 to 1.0 or 0 to 100
  level?: "high" | "medium" | "low";
  reason?: string;
  className?: string;
}

export default function ConfidenceIndicator({
  confidence,
  level,
  reason,
  className = ""
}: ConfidenceIndicatorProps) {
  const normalized = confidence > 1 ? confidence : Math.round(confidence * 100);
  const calculatedLevel = level || (normalized >= 90 ? "high" : normalized >= 70 ? "medium" : "low");

  const config = {
    high: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/25",
      text: "text-emerald-400",
      icon: ShieldCheck,
      label: "High Confidence"
    },
    medium: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/25",
      text: "text-amber-400",
      icon: AlertTriangle,
      label: "Medium Confidence"
    },
    low: {
      bg: "bg-rose-500/10",
      border: "border-rose-500/25",
      text: "text-rose-400",
      icon: AlertCircle,
      label: "Review Needed"
    }
  }[calculatedLevel];

  const Icon = config.icon;

  return (
    <div className={`group relative inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${config.bg} ${config.border} ${config.text} ${className}`}>
      <Icon size={14} />
      <span>{normalized}%</span>
      <span className="hidden sm:inline font-normal opacity-80">({config.label})</span>

      {reason && (
        <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-64 -translate-x-1/2 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs font-normal text-zinc-300 opacity-0 shadow-2xl transition-opacity duration-200 group-hover:opacity-100 z-50">
          <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
            <HelpCircle size={13} className="text-violet-400" />
            Why this category?
          </div>
          <p className="text-zinc-400 leading-relaxed">{reason}</p>
        </div>
      )}
    </div>
  );
}
