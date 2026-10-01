import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/bills/auth-helper";
import { importService } from "@/lib/imports/import-service";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUserId(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;
    const batch = await importService.getBatch(id, auth.userId);
    if (!batch) {
      return NextResponse.json({ error: "Import batch not found." }, { status: 404 });
    }

    const txns = await importService.getBatchTransactions(id, auth.userId);

    // Parse query filters
    const url = new URL(req.url);
    const filterType = url.searchParams.get("type"); // expense, income, transfer, duplicate, etc.
    const filterStatus = url.searchParams.get("status"); // pending, accepted, ignored
    const search = url.searchParams.get("search")?.toLowerCase();

    let filtered = txns;
    if (filterType) {
      if (filterType === "duplicate") {
        filtered = filtered.filter(t => t.dedupe_status !== "unique");
      } else {
        filtered = filtered.filter(t => t.transaction_type === filterType);
      }
    }
    if (filterStatus) {
      filtered = filtered.filter(t => t.review_status === filterStatus);
    }
    if (search) {
      filtered = filtered.filter(
        t =>
          (t.merchant || "").toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          (t.reference_id || "").toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      batch_id: id,
      total: txns.length,
      filtered_count: filtered.length,
      transactions: filtered,
      summary: batch.summary
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch review transactions." },
      { status: 500 }
    );
  }
}
