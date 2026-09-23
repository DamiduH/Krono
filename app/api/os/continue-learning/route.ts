import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: progress, error } = await supabase
    .from("module_progress")
    .select("module_id, seconds_watched")
    .eq("user_id", userId)
    .eq("completed", false)
    .gt("seconds_watched", 0)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!progress) {
    return NextResponse.json({ resume: null });
  }

  const { data: module, error: moduleError } = await supabase
    .from("course_modules")
    .select("id, title, duration_seconds, course_id")
    .eq("id", progress.module_id)
    .maybeSingle();

  if (moduleError) {
    return NextResponse.json({ error: moduleError.message }, { status: 500 });
  }
  if (!module) {
    return NextResponse.json({ resume: null });
  }

  return NextResponse.json({
    resume: {
      moduleId: module.id,
      courseId: module.course_id,
      title: module.title,
      durationSeconds: module.duration_seconds,
      secondsWatched: progress.seconds_watched,
    },
  });
}
