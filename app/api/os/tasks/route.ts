import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { userId, projectId, title, dueDate, notionUrl } =
    (await request.json()) as {
      userId?: string;
      projectId?: string;
      title?: string;
      dueDate?: string | null;
      notionUrl?: string | null;
    };

  if (!userId || !projectId || !title?.trim()) {
    return NextResponse.json(
      { error: "userId, projectId and title are required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: row, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      project_id: projectId,
      title: title.trim(),
      due_date: dueDate || null,
      notion_url: notionUrl || null,
      source: "manual",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: row.id });
}
