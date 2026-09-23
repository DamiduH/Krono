import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

interface HabitCheckIn {
  userId?: string;
  habitId?: string;
  completed?: boolean;
  minutes?: number;
}

export async function POST(request: NextRequest) {
  const { userId, habitId, completed, minutes } =
    (await request.json()) as HabitCheckIn;

  if (!userId || !habitId) {
    return NextResponse.json(
      { error: "userId and habitId are required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const { data: habit, error: habitError } = await supabase
    .from("habits")
    .select("target_minutes")
    .eq("id", habitId)
    .eq("user_id", userId)
    .maybeSingle();

  if (habitError) {
    return NextResponse.json({ error: habitError.message }, { status: 500 });
  }
  if (!habit) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("daily_logs")
    .select("id, minutes_logged")
    .eq("user_id", userId)
    .eq("habit_id", habitId)
    .eq("type", "habit")
    .eq("date", today)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (completed === false) {
    if (existing) {
      const { error: deleteError } = await supabase
        .from("daily_logs")
        .delete()
        .eq("id", existing.id);
      if (deleteError) {
        return NextResponse.json(
          { error: deleteError.message },
          { status: 500 }
        );
      }
    }
    return NextResponse.json({ minutesToday: 0 });
  }

  const minutesToday = Math.max(
    0,
    Math.floor(minutes ?? existing?.minutes_logged ?? habit.target_minutes)
  );

  if (existing) {
    const { error: updateError } = await supabase
      .from("daily_logs")
      .update({ minutes_logged: minutesToday })
      .eq("id", existing.id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  } else {
    const { error: insertError } = await supabase.from("daily_logs").insert({
      user_id: userId,
      habit_id: habitId,
      type: "habit",
      minutes_logged: minutesToday,
      date: today,
    });
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ minutesToday });
}
