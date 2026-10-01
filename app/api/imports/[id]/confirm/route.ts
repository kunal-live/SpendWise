import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/bills/auth-helper";
import { importService } from "@/lib/imports/import-service";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUserId(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;
    let transactionIds: string[] | undefined;

    try {
      const body = await req.json();
      if (body && Array.isArray(body.transaction_ids)) {
        transactionIds = body.transaction_ids;
      }
    } catch {}

    const result = await importService.confirmImport(id, transactionIds, auth.userId);

    return NextResponse.json({
      success: true,
      imported: result.importedCount,
      skipped: result.skippedCount,
      duplicates: result.duplicateCount,
      created_expenses: result.createdExpenses
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to confirm statement import." },
      { status: 400 }
    );
  }
}
