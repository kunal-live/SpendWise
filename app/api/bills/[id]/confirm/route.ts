import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/bills/auth-helper";
import { billService } from "@/lib/bills/bill-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUserId(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const {
      merchant,
      amount,
      currency,
      category,
      category_id,
      transaction_date,
      payment_method,
      notes,
      invoice_number,
      items
    } = body;

    const chosenCategory = category || category_id;
    if (!chosenCategory) {
      return NextResponse.json({ error: "Expense category is required." }, { status: 400 });
    }

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Valid expense amount is required." }, { status: 400 });
    }

    const result = await billService.confirmBill(
      id,
      {
        merchant: merchant || "Bill Expense",
        amount: Number(amount),
        currency: currency || "INR",
        category: chosenCategory,
        transaction_date: transaction_date || new Date().toISOString().slice(0, 10),
        payment_method: payment_method || "UPI",
        notes: notes || "",
        invoice_number: invoice_number,
        items: items
      },
      auth.userId
    );

    return NextResponse.json({
      expense_id: result.expense.id,
      status: "created",
      expense: result.expense,
      bill: result.bill
    });
  } catch (err: any) {
    const message = err?.message || "Failed to confirm bill.";
    const status = message.includes("not found") ? 404 : message.includes("already been confirmed") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
