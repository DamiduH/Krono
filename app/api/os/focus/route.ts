import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { userId, minutes } = (await request.json()) as {
    userId?: string;
    minutes?: number;
  };

  const value = Math.floor(minutes ?? 0);
  if (!userId || value <= 0) {
    return NextResponse.json(
      { error: "userId and a positive minutes value are required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("daily_logs").insert({
    user_id: userId,
    type: "focus",
    minutes_logged: value,
    date: today,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
