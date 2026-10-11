import { useState } from "react";
import { ExtractedBillData, BillItem } from "@/lib/types";
import CategorySelector from "./CategorySelector";
import ConfidenceIndicator from "./ConfidenceIndicator";
import DatePicker from "@/components/DatePicker";
import { Plus, Trash2, Calendar, Receipt, CreditCard, Tag, AlertCircle, Sparkles } from "lucide-react";

export interface ExtractedBillFormProps {
  initialData: ExtractedBillData;
  onConfirm: (formData: ExtractedBillData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function ExtractedBillForm({
  initialData,
  onConfirm,
  onCancel,
  isSubmitting = false
}: ExtractedBillFormProps) {
  const [formData, setFormData] = useState<ExtractedBillData>({
    ...initialData,
    items: initialData.items ? [...initialData.items] : []
  });

  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function handleAddItem() {
    if (!newItemName.trim()) return;
    const price = Number(newItemPrice) || 0;
    const item: BillItem = {
      name: newItemName.trim(),
      quantity: 1,
      unit_price: price,
      total_price: price
    };
    setFormData({
      ...formData,
      items: [...(formData.items || []), item]
    });
    setNewItemName("");
    setNewItemPrice("");
  }

  function handleRemoveItem(index: number) {
    const updated = [...(formData.items || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, items: updated });
  }

  function handleSubmit() {
    setFormError(null);
    if (!formData.merchant || !formData.merchant.trim()) {
      setFormError("Please enter a merchant name.");
      return;
    }
    if (!formData.total || Number(formData.total) <= 0) {
      setFormError("Please enter a valid expense total greater than zero.");
      return;
    }
    if (!formData.transaction_date) {
      setFormError("Please select a transaction date.");
      return;
    }
    if (!formData.suggested_category) {
      setFormError("Please select a category.");
      return;
    }

    onConfirm(formData);
  }

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* Top Banner with Confidence */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#382D25] bg-[#1D1815] p-4">
        <div>
          <div className="text-sm font-bold text-[#F6F2EB]">
            Extracted Bill Details
          </div>
        </div>

        <ConfidenceIndicator
          confidence={formData.confidence}
          level={formData.confidence_level}
          reason={formData.classification_reason}
        />
      </div>

      {formError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-700">
          <AlertCircle size={15} className="shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Form Fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Merchant */}
        <label className="block text-xs font-semibold text-[#8C8176]">
          <span className="mb-1.5 block">Merchant / Store *</span>
          <input
            type="text"
            className="w-full rounded-xl border border-[#382D25] bg-[#26201B] px-4 py-2.5 text-sm text-[#F6F2EB] placeholder-[#8C8176] outline-none focus:border-[#E07A28] focus:bg-[#1D1815] transition-all"
            value={formData.merchant}
            onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
            placeholder="e.g. Amazon, Swiggy, Uber"
          />
        </label>

        {/* Total Amount */}
        <label className="block text-xs font-semibold text-[#8C8176]">
          <span className="mb-1.5 block">Total Amount (₹) *</span>
          <div className="flex items-center rounded-xl border border-[#382D25] bg-[#26201B] px-3 py-0.5 focus-within:border-[#E07A28] focus-within:bg-[#1D1815] transition-all">
            <span className="text-sm font-bold text-[#E07A28]">₹</span>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full bg-transparent px-2 py-2 text-sm font-bold text-[#F6F2EB] placeholder-[#8C8176] outline-none"
              value={formData.total || ""}
              onChange={(e) => setFormData({ ...formData, total: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
            />
          </div>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Category */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#8C8176]">
            Expense Category *
          </label>
          <CategorySelector
            value={formData.suggested_category}
            suggestedCategory={initialData.suggested_category}
            confidence={formData.confidence}
            onChange={(cat) => setFormData({ ...formData, suggested_category: cat })}
          />
        </div>

        {/* Transaction Date */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#8C8176]">
            Date of Bill *
          </label>
          <DatePicker
            value={formData.transaction_date}
            onChange={(date) => setFormData({ ...formData, transaction_date: date })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Payment Method */}
        <label className="block text-xs font-semibold text-[#8C8176]">
          <span className="mb-1.5 block">Payment Method</span>
          <select
            className="w-full rounded-xl border border-[#382D25] bg-[#26201B] px-4 py-2.5 text-sm text-[#F6F2EB] outline-none focus:border-[#E07A28] focus:bg-[#1D1815] transition-all"
            value={formData.payment_method}
            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
          >
            <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
            <option value="Card">Card (Credit / Debit)</option>
            <option value="Bank">NetBanking / Bank Transfer</option>
            <option value="Cash">Cash / Cash on Delivery</option>
            <option value="Other">Other</option>
          </select>
        </label>

        {/* Invoice Number */}
        <label className="block text-xs font-semibold text-[#8C8176]">
          <span className="mb-1.5 block">Invoice / Receipt #</span>
          <input
            type="text"
            className="w-full rounded-xl border border-[#382D25] bg-[#26201B] px-4 py-2.5 text-sm text-[#F6F2EB] placeholder-[#8C8176] outline-none focus:border-[#E07A28] focus:bg-[#1D1815] transition-all"
            value={formData.invoice_number || ""}
            onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
            placeholder="INV-12345 (Optional)"
          />
        </label>
      </div>

      {/* Line Items Section */}
      <div className="rounded-2xl border border-[#382D25] bg-[#1D1815] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-[#F6F2EB]">
            Purchased Items ({formData.items?.length || 0})
          </div>
        </div>

        {formData.items && formData.items.length > 0 ? (
          <div className="divide-y divide-[#382D25] max-h-40 overflow-y-auto pr-1">
            {formData.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 text-xs">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="truncate text-[#F6F2EB] font-medium">{item.name}</span>
                  {item.quantity && item.quantity > 1 && (
                    <span className="rounded bg-[#26201B] border border-[#382D25] px-1.5 py-0.2 text-[10px] text-[#8C8176] shrink-0">
                      x{item.quantity}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {item.total_price !== undefined && item.total_price > 0 && (
                    <span className="font-semibold text-[#F6F2EB]">
                      ₹{item.total_price.toLocaleString("en-IN")}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="text-[#8C8176] hover:text-rose-600 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-3 text-center text-xs text-[#8C8176]">
            No specific items extracted. You can add items below.
          </div>
        )}

        {/* Add custom item */}
        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-[#382D25]">
          <input
            type="text"
            className="flex-1 rounded-lg border border-[#382D25] bg-[#26201B] px-3 py-1.5 text-xs text-[#F6F2EB] placeholder-[#8C8176] outline-none focus:border-[#E07A28] focus:bg-[#1D1815]"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Item name (e.g. Nike T-Shirt)"
          />
          <input
            type="number"
            className="w-24 rounded-lg border border-[#382D25] bg-[#26201B] px-3 py-1.5 text-xs text-[#F6F2EB] placeholder-[#8C8176] outline-none focus:border-[#E07A28] focus:bg-[#1D1815]"
            value={newItemPrice}
            onChange={(e) => setNewItemPrice(e.target.value)}
            placeholder="Price (₹)"
          />
          <button
            type="button"
            onClick={handleAddItem}
            className="rounded-lg bg-[#E07A28]/10 hover:bg-[#E07A28]/20 text-[#E07A28] px-3 py-1.5 text-xs font-semibold transition-colors shrink-0"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Financial Details (Subtotal, Tax, Discount) */}
      {(formData.tax || formData.subtotal || formData.discount) ? (
        <div className="flex flex-wrap gap-4 text-xs text-[#C6BCB3] bg-[#1D1815] p-3 rounded-xl border border-[#382D25]">
          {formData.subtotal ? <span>Subtotal: ₹{formData.subtotal}</span> : null}
          {formData.tax ? <span className="text-amber-700">GST / Tax: ₹{formData.tax}</span> : null}
          {formData.discount ? <span className="text-emerald-700">Discount: -₹{formData.discount}</span> : null}
        </div>
      ) : null}

      {/* Buttons */}
      <div className="mt-auto flex items-center justify-end gap-3 pt-3 border-t border-[#382D25]">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-xl px-4 py-2.5 text-xs font-semibold text-[#8C8176] hover:bg-[#28211B] hover:text-[#F6F2EB] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E07A28] to-[#C25B15] px-5 py-2.5 text-xs font-bold text-white hover:brightness-105 transition-all shadow-lg shadow-[#E07A28]/25 disabled:opacity-50"
        >
          {isSubmitting ? "Creating Expense..." : "Confirm & Add Expense"}
        </button>
      </div>
    </div>
  );
}
