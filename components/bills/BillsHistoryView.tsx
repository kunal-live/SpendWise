"use client";

import { useState, useEffect } from "react";
import { BillDocument } from "@/lib/types";
import { FileText, CheckCircle2, Clock, AlertTriangle, ExternalLink, RefreshCw, Upload, Eye } from "lucide-react";
import BillPreview from "./BillPreview";

export interface BillsHistoryViewProps {
  onOpenUploadModal: () => void;
}

export default function BillsHistoryView({ onOpenUploadModal }: BillsHistoryViewProps) {
  const [bills, setBills] = useState<BillDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<BillDocument | null>(null);

  async function fetchBills() {
    setLoading(true);
    try {
      const res = await fetch("/api/bills");
      if (res.ok) {
        const data = await res.json();
        setBills(data.bills || []);
      }
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    fetchBills();
  }, []);

  function formatMoney(amount: number) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#F6F2EB]">Uploaded Bills &amp; Invoices</h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchBills}
            className="rounded-xl border border-[#382D25] bg-[#1D1815] p-2.5 text-[#8C8176] hover:bg-[#28211B] hover:text-[#F6F2EB] transition-colors"
            title="Refresh bills"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E07A28] to-[#C25B15] px-4 py-2.5 text-sm font-bold text-white hover:brightness-105 transition-all shadow-lg shadow-[#E07A28]/25"
          >
            <Upload size={16} /> Upload Bill
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20 text-[#8C8176]">
          <RefreshCw size={24} className="animate-spin text-[#E07A28] mb-2" />
          <span className="text-xs">Loading uploaded bills...</span>
        </div>
      ) : bills.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#382D25] bg-[#1D1815]/60 p-12 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#E07A28]/10 text-[#E07A28]">
            <FileText size={28} />
          </div>
          <h3 className="text-base font-bold text-[#F6F2EB]">No bills uploaded yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-[#8C8176]">
            Upload your receipts or PDF invoices to automatically extract merchants, items, and assign smart categories.
          </p>
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E07A28] to-[#C25B15] px-4 py-2 text-xs font-bold text-white hover:brightness-105 transition-all shadow-lg shadow-[#E07A28]/25"
          >
            <Upload size={14} /> Upload First Bill
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bills.map((bill) => {
            const isConfirmed = bill.processing_status === "confirmed";
            const data = bill.extracted_data || {};
            const merchant = data.merchant || "Unknown Merchant";
            const total = data.total || 0;
            const category = data.suggested_category || "Other";
            const confidence = data.confidence ? Math.round(data.confidence * 100) : 80;

            return (
              <div
                key={bill.id}
                className="flex flex-col justify-between rounded-2xl border border-[#382D25] bg-[#1D1815] p-5 transition-all hover:border-[#E07A28]/50 hover:bg-[#28211B] group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#E07A28]/10 text-[#E07A28]">
                        <FileText size={16} />
                      </div>
                      <span className="truncate text-xs font-bold text-[#F6F2EB] max-w-[140px]">
                        {merchant}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isConfirmed
                          ? "bg-emerald-500/10 text-emerald-800 border border-emerald-500/25"
                          : "bg-amber-500/10 text-amber-800 border border-amber-500/25"
                      }`}
                    >
                      {isConfirmed ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                      {isConfirmed ? "Confirmed" : "Review Ready"}
                    </span>
                  </div>

                  <div className="mt-2 text-xl font-black text-[#F6F2EB]">
                    {formatMoney(total)}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-[#8C8176]">
                    <span className="rounded-md bg-[#26201B] px-2 py-0.5 border border-[#382D25] text-[11px] text-[#F6F2EB]">
                      {category}
                    </span>
                    <span className="text-[#8C8176]">•</span>
                    <span className="text-[11px] text-[#8C8176]">
                      {data.transaction_date || bill.created_at.slice(0, 10)}
                    </span>
                    <span className="text-[#8C8176]">•</span>
                    <span className="text-[11px] text-[#E07A28] font-medium">
                      {confidence}% match
                    </span>
                  </div>

                  {data.items && data.items.length > 0 && (
                    <div className="mt-3 text-[11px] text-[#8C8176] truncate">
                      Items: {data.items.map((i: any) => i.name).slice(0, 2).join(", ")}
                      {data.items.length > 2 ? ` +${data.items.length - 2} more` : ""}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#382D25] pt-3">
                  <span className="truncate text-[10px] text-[#8C8176] max-w-[130px]">
                    {bill.original_filename}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedBill(bill)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#E07A28] hover:text-[#C25B15] transition-colors"
                  >
                    <Eye size={13} /> View Receipt
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bill Preview Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-md">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[#382D25] bg-[#1D1815] p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#382D25]">
                <div>
                  <h3 className="text-lg font-bold text-[#F6F2EB]">
                    {selectedBill.extracted_data?.merchant || selectedBill.original_filename}
                  </h3>
                  <div className="text-xs text-[#8C8176]">
                    Uploaded on {new Date(selectedBill.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBill(null)}
                  className="rounded-xl p-1.5 text-[#8C8176] hover:bg-[#28211B] hover:text-[#F6F2EB] transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 h-[420px]">
                <BillPreview
                  billId={selectedBill.id}
                  mimeType={selectedBill.mime_type}
                  filename={selectedBill.original_filename}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
