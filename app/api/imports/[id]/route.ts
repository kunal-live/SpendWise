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

    return NextResponse.json({
      success: true,
      batch,
      summary: batch.summary
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch import batch." },
      { status: 500 }
    );
  }
}
