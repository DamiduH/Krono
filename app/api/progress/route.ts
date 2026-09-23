import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

interface ProgressUpdate {
  userId?: string;
  moduleId?: string;
  completed?: boolean;
  addSeconds?: number;
}

export async function POST(request: NextRequest) {
  const { userId, moduleId, completed, addSeconds } =
    (await request.json()) as ProgressUpdate;

  if (!userId || !moduleId) {
    return NextResponse.json(
      { error: "userId and moduleId are required" },
      { status: 400 }
    );
  }

  const secondsToAdd = Math.max(0, Math.floor(addSeconds ?? 0));
  const supabase = getSupabaseAdmin();

  const { data: module, error: moduleError } = await supabase
    .from("course_modules")
    .select("duration_seconds")
    .eq("id", moduleId)
    .maybeSingle();

  if (moduleError) {
    return NextResponse.json({ error: moduleError.message }, { status: 500 });
  }
  if (!module) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("module_progress")
    .select("completed, seconds_watched, completed_at")
    .eq("user_id", userId)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  let secondsWatched = (existing?.seconds_watched ?? 0) + secondsToAdd;
  const completedFinal = completed ?? existing?.completed ?? false;

  let completedAt: string | null;
  if (completed === true) {
    completedAt = new Date().toISOString();
    // Completing a video implies it was watched in full
    secondsWatched = Math.max(secondsWatched, module.duration_seconds);
  } else if (completed === false) {
    completedAt = null;
  } else {
    completedAt = existing?.completed_at ?? null;
  }

  const { data: row, error: upsertError } = await supabase
    .from("module_progress")
    .upsert(
      {
        user_id: userId,
        module_id: moduleId,
        completed: completedFinal,
        seconds_watched: secondsWatched,
        completed_at: completedAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,module_id" }
    )
    .select("completed, seconds_watched, completed_at")
    .single();

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({
    completed: row.completed,
    secondsWatched: row.seconds_watched,
    completedAt: row.completed_at,
  });
}
