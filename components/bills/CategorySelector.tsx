import { useState, useEffect } from "react";
import { SPENDWISE_CATEGORIES, CategoryDefinition } from "@/lib/bills/classifier/categories";
import { Sparkles, Check, ChevronDown } from "lucide-react";

export interface CategorySelectorProps {
  value: string;
  onChange: (category: string) => void;
  suggestedCategory?: string;
  confidence?: number;
}

export default function CategorySelector({
  value,
  onChange,
  suggestedCategory,
  confidence
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<CategoryDefinition[]>(SPENDWISE_CATEGORIES);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Attempt to fetch dynamic categories from API
    fetch("/api/categories")
      .then(res => res.json())
      .then(data => {
        if (data?.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});
  }, []);

  const selected = categories.find(c => c.name.toLowerCase() === value.toLowerCase()) || {
    name: value || "Other",
    color: "#a8a093"
  };

  const isOverridden = suggestedCategory && value.toLowerCase() !== suggestedCategory.toLowerCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-[#382D25] bg-[#26201B] px-4 py-3 text-left outline-none transition-all hover:border-[#E07A28]/50 focus:border-[#E07A28] focus:bg-[#1D1815]"
      >
        <div className="flex items-center gap-3">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: (selected as any).color || "#E07A28" }}
          />
          <div>
            <div className="text-sm font-semibold text-[#F6F2EB] flex items-center gap-2">
              {selected.name}
              {suggestedCategory && value.toLowerCase() === suggestedCategory.toLowerCase() && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#E07A28]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#E07A28] ring-1 ring-inset ring-[#E07A28]/25">
                  <Sparkles size={10} /> Auto-suggested
                </span>
              )}
            </div>
            {isOverridden && (
              <div className="text-[11px] text-amber-700">
                Corrected from suggested: {suggestedCategory}
              </div>
            )}
          </div>
        </div>
        <ChevronDown size={16} className={`text-[#8C8176] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 max-h-64 overflow-y-auto rounded-2xl border border-[#382D25] bg-[#1D1815] p-2 shadow-2xl backdrop-blur-xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C8176] px-3 py-1.5">
            Select Category
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {categories.map((cat) => {
              const isSelected = cat.name.toLowerCase() === value.toLowerCase();
              const isSuggested = suggestedCategory && cat.name.toLowerCase() === suggestedCategory.toLowerCase();

              return (
                <button
                  key={cat.id || cat.name}
                  type="button"
                  onClick={() => {
                    onChange(cat.name);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-colors ${
                    isSelected
                      ? "bg-[#E07A28]/15 text-[#E07A28] font-semibold"
                      : "text-[#C6BCB3] hover:bg-[#28211B] hover:text-[#F6F2EB]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: cat.color || "#E07A28" }}
                    />
                    <span className="truncate">{cat.name}</span>
                    {isSuggested && (
                      <span className="shrink-0 text-[10px] text-[#E07A28] font-normal">
                        (Suggested)
                      </span>
                    )}
                  </div>
                  {isSelected && <Check size={14} className="text-[#E07A28] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
