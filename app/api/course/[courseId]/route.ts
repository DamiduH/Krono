import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { CourseDetails, CourseModule } from "@/lib/types";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/course/[courseId]">
) {
  const { courseId } = await ctx.params;
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: course, error } = await supabase
    .from("courses")
    .select("id, title, total_modules, total_seconds")
    .eq("id", courseId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const { data: modules, error: modulesError } = await supabase
    .from("course_modules")
    .select("id, title, duration_seconds, order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  if (modulesError) {
    return NextResponse.json({ error: modulesError.message }, { status: 500 });
  }

  const moduleIds = (modules ?? []).map((m) => m.id);
  const { data: progress, error: progressError } = await supabase
    .from("module_progress")
    .select("module_id, completed, seconds_watched")
    .eq("user_id", userId)
    .in("module_id", moduleIds);

  if (progressError) {
    return NextResponse.json({ error: progressError.message }, { status: 500 });
  }

  const progressByModule = new Map(progress.map((p) => [p.module_id, p]));

  const detailedModules: CourseModule[] = (modules ?? []).map((m) => {
    const p = progressByModule.get(m.id);
    return {
      id: m.id,
      title: m.title,
      durationSeconds: m.duration_seconds,
      orderIndex: m.order_index,
      completed: p?.completed ?? false,
      secondsWatched: p?.seconds_watched ?? 0,
    };
  });

  const completedModules = detailedModules.filter((m) => m.completed).length;
  const watchedSeconds = detailedModules.reduce(
    (sum, m) => sum + m.secondsWatched,
    0
  );

  const details: CourseDetails = {
    course: {
      id: course.id,
      title: course.title,
      totalModules: course.total_modules,
      totalSeconds: course.total_seconds,
      completedModules,
      watchedSeconds,
    },
    modules: detailedModules,
  };

  return NextResponse.json(details);
}
