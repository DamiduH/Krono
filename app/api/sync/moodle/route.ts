import { NextRequest, NextResponse } from "next/server";
import ical from "node-ical";
import { getSupabaseAdmin } from "@/lib/supabase";

interface ParsedEvent {
  type?: string;
  uid?: string;
  summary?: string;
  start?: Date;
  end?: Date;
}

export async function POST(request: NextRequest) {
  const { icsUrl, userId, projectId } = (await request.json()) as {
    icsUrl?: string;
    userId?: string;
    projectId?: string;
  };

  if (!icsUrl || !userId || !projectId) {
    return NextResponse.json(
      { error: "icsUrl, userId and projectId are required" },
      { status: 400 }
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(icsUrl);
  } catch {
    return NextResponse.json({ error: "Invalid calendar URL" }, { status: 400 });
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return NextResponse.json(
      { error: "Calendar URL must be http or https" },
      { status: 400 }
    );
  }

  let calendar: Record<string, ParsedEvent>;
  try {
    calendar = (await ical.fromURL(icsUrl)) as unknown as Record<
      string,
      ParsedEvent
    >;
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch or parse the calendar feed" },
      { status: 502 }
    );
  }

  const now = new Date();
  const rows = Object.values(calendar)
    .filter(
      (event): event is ParsedEvent =>
        event.type === "VEVENT" &&
        event.start instanceof Date &&
        typeof event.uid === "string" &&
        (event.end ?? event.start) > now
    )
    .map((event) => ({
      user_id: userId,
      project_id: projectId,
      title: String(event.summary ?? "Untitled assignment"),
      due_date: (event.start as Date).toISOString(),
      source: "moodle" as const,
      external_id: event.uid as string,
    }));

  const supabase = getSupabaseAdmin();

  const { data: existing, error: existingError } = await supabase
    .from("tasks")
    .select("external_id")
    .eq("user_id", userId)
    .eq("source", "moodle")
    .not("external_id", "is", null);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const existingIds = new Set(existing.map((row) => row.external_id));
  const added = rows.filter((row) => !existingIds.has(row.external_id)).length;
  const updated = rows.length - added;

  if (rows.length > 0) {
    const { error: upsertError } = await supabase
      .from("tasks")
      .upsert(rows, { onConflict: "user_id,source,external_id" });

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ added, updated, total: rows.length });
}
