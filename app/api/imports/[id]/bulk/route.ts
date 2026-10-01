import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/bills/auth-helper";
import { importService } from "@/lib/imports/import-service";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUserId(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const transactionIds = body.transaction_ids as string[] | undefined;
    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json({ error: "No transaction_ids provided for bulk update." }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (body.category_id || body.category) {
      const cat = body.category || body.category_id;
      updates.selected_category = cat;
      updates.suggested_category = cat;
      updates.review_status = "edited";
    }
    if (body.transaction_type) {
      updates.transaction_type = body.transaction_type;
      updates.review_status = "edited";
    }
    if (body.review_status) {
      updates.review_status = body.review_status;
    }

    const modifiedCount = await importService.bulkUpdateTransactions(id, transactionIds, updates, auth.userId);

    const batch = await importService.getBatch(id, auth.userId);

    return NextResponse.json({
      success: true,
      modified_count: modifiedCount,
      summary: batch?.summary
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to execute bulk update." },
      { status: 400 }
    );
  }
}
