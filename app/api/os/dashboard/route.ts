import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getDomainProgress } from "@/lib/domains";
import type {
  DashboardData,
  DashboardDomain,
  DashboardHabit,
  DashboardTask,
} from "@/lib/types";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const [domainsRes, habitsRes, logsRes] = await Promise.all([
    supabase
      .from("domains")
      .select("id, title, target_hours, deadline")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("habits")
      .select("id, title, is_negative, target_minutes")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("daily_logs")
      .select("habit_id, type, minutes_logged")
      .eq("user_id", userId)
      .eq("date", today),
  ]);

  if (domainsRes.error || habitsRes.error || logsRes.error) {
    const error = domainsRes.error || habitsRes.error || logsRes.error;
    return NextResponse.json({ error: error!.message }, { status: 500 });
  }

  let domainProgress: Awaited<ReturnType<typeof getDomainProgress>> = [];
  try {
    domainProgress = await getDomainProgress(userId);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "RPC failed" },
      { status: 500 }
    );
  }

  const domains = domainsRes.data;
  const habits = habitsRes.data;
  const logs = logsRes.data;

  const domainIds = domains.map((d) => d.id);
  let projects: {
    id: string;
    domain_id: string;
    title: string;
    status: string;
  }[] = [];
  let tasks: {
    id: string;
    title: string;
    is_completed: boolean;
    due_date: string | null;
    project_id: string;
    source: string;
  }[] = [];

  if (domainIds.length > 0) {
    const projectsRes = await supabase
      .from("projects")
      .select("id, domain_id, title, status")
      .in("domain_id", domainIds)
      .order("created_at", { ascending: true });
    if (projectsRes.error) {
      return NextResponse.json(
        { error: projectsRes.error.message },
        { status: 500 }
      );
    }
    projects = projectsRes.data;

    const projectIds = projects.map((p) => p.id);
    if (projectIds.length > 0) {
      const tasksRes = await supabase
        .from("tasks")
        .select("id, title, is_completed, due_date, project_id, source")
        .in("project_id", projectIds);
      if (tasksRes.error) {
        return NextResponse.json(
          { error: tasksRes.error.message },
          { status: 500 }
        );
      }
      tasks = tasksRes.data;
    }
  }

  const watchedByDomain = new Map(
    domainProgress.map((p) => [p.domain_id, p.total_video_seconds])
  );

  const dashboardDomains: DashboardDomain[] = domains.map((d) => ({
    id: d.id,
    title: d.title,
    targetHours: d.target_hours,
    deadline: d.deadline,
    watchedSeconds: watchedByDomain.get(d.id) ?? 0,
    projects: projects
      .filter((p) => p.domain_id === d.id)
      .map((p) => {
        const projectTasks = tasks.filter((t) => t.project_id === p.id);
        return {
          id: p.id,
          title: p.title,
          status: p.status as "active" | "completed",
          tasksTotal: projectTasks.length,
          tasksCompleted: projectTasks.filter((t) => t.is_completed).length,
        };
      }),
  }));

  const dashboardHabits: DashboardHabit[] = habits.map((h) => ({
    id: h.id,
    title: h.title,
    isNegative: h.is_negative,
    targetMinutes: h.target_minutes,
    minutesToday: logs
      .filter((l) => l.type === "habit" && l.habit_id === h.id)
      .reduce((sum, l) => sum + l.minutes_logged, 0),
  }));

  const projectTitles = new Map(projects.map((p) => [p.id, p.title]));
  const dashboardTasks: DashboardTask[] = tasks
    .filter((t) => !t.is_completed)
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    })
    .slice(0, 8)
    .map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.due_date,
      projectTitle: projectTitles.get(t.project_id) ?? "Unknown project",
      source: t.source as "manual" | "moodle",
    }));

  const focusMinutesToday = logs
    .filter((l) => l.type === "focus")
    .reduce((sum, l) => sum + l.minutes_logged, 0);

  const data: DashboardData = {
    domains: dashboardDomains,
    habits: dashboardHabits,
    tasks: dashboardTasks,
    focusMinutesToday,
  };

  return NextResponse.json(data);
}
