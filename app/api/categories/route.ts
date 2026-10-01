import { NextResponse } from "next/server";
import { SPENDWISE_CATEGORIES } from "@/lib/bills/classifier/categories";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (data && !error && data.length > 0) {
      return NextResponse.json({ categories: data });
    }
  } catch {}

  // Fallback to standard categories
  return NextResponse.json({ categories: SPENDWISE_CATEGORIES });
}
