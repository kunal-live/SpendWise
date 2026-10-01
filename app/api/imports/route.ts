import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/bills/auth-helper";
import { importService } from "@/lib/imports/import-service";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserId(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const source = (formData.get("source") as string) || "auto";

    if (!file) {
      return NextResponse.json({ error: "Missing file in upload payload." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await importService.processImportUpload({
      userId: auth.userId,
      fileBuffer: buffer,
      originalFilename: file.name,
      preferredSource: source !== "auto" ? source : undefined
    });

    return NextResponse.json({
      success: true,
      import_id: result.batch.id,
      status: result.batch.status,
      batch: result.batch,
      summary: result.batch.summary,
      total_rows: result.batch.total_rows
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to process statement import." },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserId(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const batches = await importService.listUserBatches(auth.userId);
    return NextResponse.json({
      success: true,
      batches
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch import batches." },
      { status: 500 }
    );
  }
}
