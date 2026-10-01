import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/bills/auth-helper";
import { billService } from "@/lib/bills/bill-service";
import { billStorage } from "@/lib/bills/storage/bill-storage";

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
      return NextResponse.json({ error: "File not found or access denied." }, { status: 404 });
    }

    // Strict ownership verification: bill.user_id must match auth.userId
    if (bill.user_id !== auth.userId) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const fileBuffer = await billStorage.getBill(bill.storage_key, auth.userId);
    if (!fileBuffer) {
      return NextResponse.json({ error: "File could not be retrieved from storage." }, { status: 404 });
    }

    const response = new NextResponse(new Uint8Array(fileBuffer));
    response.headers.set("Content-Type", bill.mime_type || "application/octet-stream");
    response.headers.set("Content-Length", fileBuffer.length.toString());
    response.headers.set(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(bill.original_filename)}"`
    );
    response.headers.set("Cache-Control", "private, max-age=3600");

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to retrieve bill file." }, { status: 500 });
  }
}
