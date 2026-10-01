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
    const result = await importService.undoImport(id, auth.userId);

    return NextResponse.json({
      success: true,
      message: `Successfully reverted import batch. Removed ${result.undoneCount} expenses.`,
      undone_count: result.undoneCount
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to undo import." },
      { status: 400 }
    );
  }
}
