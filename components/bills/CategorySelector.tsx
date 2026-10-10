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
        className="flex w-full items-center justify-between rounded-xl border border-[#E5DFD3] bg-[#F4EFE6] px-4 py-3 text-left outline-none transition-all hover:border-[#FF6B4A]/50 focus:border-[#FF6B4A] focus:bg-[#FFFDF9]"
      >
        <div className="flex items-center gap-3">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: (selected as any).color || "#FF6B4A" }}
          />
          <div>
            <div className="text-sm font-semibold text-[#14151A] flex items-center gap-2">
              {selected.name}
              {suggestedCategory && value.toLowerCase() === suggestedCategory.toLowerCase() && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#FF6B4A]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#FF6B4A] ring-1 ring-inset ring-[#FF6B4A]/25">
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
        <ChevronDown size={16} className={`text-[#7A756D] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 max-h-64 overflow-y-auto rounded-2xl border border-[#E5DFD3] bg-[#FFFDF9] p-2 shadow-2xl backdrop-blur-xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A756D] px-3 py-1.5">
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
                      ? "bg-[#FF6B4A]/15 text-[#FF6B4A] font-semibold"
                      : "text-[#45423E] hover:bg-[#F4EFE6] hover:text-[#14151A]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: cat.color || "#FF6B4A" }}
                    />
                    <span className="truncate">{cat.name}</span>
                    {isSuggested && (
                      <span className="shrink-0 text-[10px] text-[#FF6B4A] font-normal">
                        (Suggested)
                      </span>
                    )}
                  </div>
                  {isSelected && <Check size={14} className="text-[#FF6B4A] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
