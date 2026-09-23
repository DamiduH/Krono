import { NextRequest, NextResponse } from "next/server";
import { extractPlaylistId, getPlaylistCourseDetails } from "@/lib/youtube";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { playlistUrl, userId } = (await request.json()) as {
      playlistUrl?: string;
      userId?: string;
    };

    if (!playlistUrl || !userId) {
      return NextResponse.json(
        { error: "playlistUrl and userId are required" },
        { status: 400 }
      );
    }

    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      return NextResponse.json(
        { error: "Invalid YouTube playlist URL" },
        { status: 400 }
      );
    }

    const details = await getPlaylistCourseDetails(playlistId);
    const supabase = getSupabaseAdmin();

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        user_id: userId,
        title: details.playlistTitle,
        source_type: "youtube",
        source_id: playlistId,
        total_modules: details.totalVideos,
        total_seconds: details.totalSeconds,
      })
      .select("id")
      .single();

    if (courseError) {
      return NextResponse.json(
        { error: `Failed to create course: ${courseError.message}` },
        { status: 500 }
      );
    }

    const { error: modulesError } = await supabase
      .from("course_modules")
      .insert(
        details.videos.map((video, index) => ({
          course_id: course.id,
          external_id: video.id,
          title: video.title,
          duration_seconds: video.durationSeconds,
          order_index: index,
        }))
      );

    if (modulesError) {
      // Cascade cleanup: remove the orphaned course row
      await supabase.from("courses").delete().eq("id", course.id);
      return NextResponse.json(
        { error: `Failed to create modules: ${modulesError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      courseId: course.id,
      title: details.playlistTitle,
      totalVideos: details.totalVideos,
      totalSeconds: details.totalSeconds,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
