import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { CourseSummary } from "@/lib/types";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, total_modules, total_seconds")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (courses.length === 0) {
    return NextResponse.json({ courses: [] });
  }

  const courseIds = courses.map((c) => c.id);
  const { data: modules, error: modulesError } = await supabase
    .from("course_modules")
    .select("id, course_id")
    .in("course_id", courseIds);

  if (modulesError) {
    return NextResponse.json({ error: modulesError.message }, { status: 500 });
  }

  const moduleIds = modules.map((m) => m.id);
  const { data: progress, error: progressError } = await supabase
    .from("module_progress")
    .select("module_id, completed, seconds_watched")
    .eq("user_id", userId)
    .in("module_id", moduleIds);

  if (progressError) {
    return NextResponse.json({ error: progressError.message }, { status: 500 });
  }

  const moduleToCourse = new Map(modules.map((m) => [m.id, m.course_id]));
  const statsByCourse = new Map<string, { completed: number; watched: number }>();

  for (const row of progress) {
    const courseId = moduleToCourse.get(row.module_id);
    if (!courseId) continue;
    const stats = statsByCourse.get(courseId) ?? { completed: 0, watched: 0 };
    if (row.completed) stats.completed += 1;
    stats.watched += row.seconds_watched;
    statsByCourse.set(courseId, stats);
  }

  const result: CourseSummary[] = courses.map((c) => {
    const stats = statsByCourse.get(c.id) ?? { completed: 0, watched: 0 };
    return {
      id: c.id,
      title: c.title,
      totalModules: c.total_modules,
      totalSeconds: c.total_seconds,
      completedModules: stats.completed,
      watchedSeconds: stats.watched,
    };
  });

  return NextResponse.json({ courses: result });
}
