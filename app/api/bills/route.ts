import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/bills/auth-helper";
import { billService } from "@/lib/bills/bill-service";

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUserId(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to upload bills." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const forceDuplicate = formData.get("forceDuplicate") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "No bill file uploaded. Please provide a file." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process bill upload through service pipeline
    const result = await billService.processBillUpload({
      userId: auth.userId,
      fileBuffer: buffer,
      originalFilename: file.name,
      mimeType: file.type || "application/octet-stream",
      forceDuplicate
    });

    return NextResponse.json(
      {
        bill_id: result.bill.id,
        status: result.bill.processing_status,
        merchant: result.extracted.merchant,
        amount: result.extracted.total,
        currency: result.extracted.currency,
        transaction_date: result.extracted.transaction_date,
        payment_method: result.extracted.payment_method,
        suggested_category: result.extracted.suggested_category,
        confidence: result.extracted.confidence,
        confidence_level: result.extracted.confidence_level,
        classification_reason: result.extracted.classification_reason,
        invoice_number: result.extracted.invoice_number,
        items: result.extracted.items,
        tax: result.extracted.tax,
        subtotal: result.extracted.subtotal,
        discount: result.extracted.discount,
        missing_fields: result.extracted.missing_fields,
        possible_duplicate: result.extracted.possible_duplicate,
        bill: result.bill
      },
      { status: 201 }
    );
  } catch (err: any) {
    const message = err?.message || "Failed to process bill upload.";
    const status = message.includes("not supported") || message.includes("empty") || message.includes("maximum") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedUserId(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const bills = await billService.getUserBills(auth.userId);
    return NextResponse.json({ bills });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to retrieve bills." }, { status: 500 });
  }
}
