import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/os/tasks/[taskId]">
) {
  const { taskId } = await ctx.params;
  const { isCompleted } = (await request.json()) as {
    isCompleted?: boolean;
  };

  if (typeof isCompleted !== "boolean") {
    return NextResponse.json(
      { error: "isCompleted boolean is required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: row, error } = await supabase
    .from("tasks")
    .update({ is_completed: isCompleted })
    .eq("id", taskId)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ id: row.id, isCompleted });
}
