import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/bills/auth-helper";
import { billService } from "@/lib/bills/bill-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUserId(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const bill = await billService.getBillById(id, auth.userId);

    if (!bill) {
      return NextResponse.json({ error: "Bill not found." }, { status: 404 });
    }

    return NextResponse.json({
      id: bill.id,
      status: bill.processing_status,
      merchant: bill.extracted_data.merchant,
      amount: bill.extracted_data.total,
      currency: bill.extracted_data.currency,
      transaction_date: bill.extracted_data.transaction_date,
      payment_method: bill.extracted_data.payment_method,
      suggested_category: bill.extracted_data.suggested_category,
      confidence: bill.extracted_data.confidence,
      confidence_level: bill.extracted_data.confidence_level,
      classification_reason: bill.extracted_data.classification_reason,
      invoice_number: bill.extracted_data.invoice_number,
      items: bill.extracted_data.items,
      tax: bill.extracted_data.tax,
      subtotal: bill.extracted_data.subtotal,
      discount: bill.extracted_data.discount,
      missing_fields: bill.extracted_data.missing_fields,
      possible_duplicate: bill.extracted_data.possible_duplicate,
      original_filename: bill.original_filename,
      created_at: bill.created_at
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
