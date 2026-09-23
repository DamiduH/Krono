import { google } from "googleapis";
import { parse, toSeconds } from "iso8601-duration";

export interface PlaylistVideo {
  id: string;
  title: string;
  durationSeconds: number;
}

export interface PlaylistCourseDetails {
  playlistTitle: string;
  totalVideos: number;
  totalSeconds: number;
  videos: PlaylistVideo[];
}

function getAuthenticatedClient() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not set");
  }
  return google.youtube({ version: "v3", auth: apiKey });
}

export function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export async function getPlaylistCourseDetails(
  playlistId: string
): Promise<PlaylistCourseDetails> {
  const yt = getAuthenticatedClient();

  const playlistRes = await yt.playlists.list({
    part: ["snippet"],
    id: [playlistId],
  });

  const playlist = playlistRes.data.items?.[0];
  if (!playlist?.snippet?.title) {
    throw new Error(`Playlist not found: ${playlistId}`);
  }
  const playlistTitle = playlist.snippet.title;

  // Collect all video IDs from the playlist, handling pagination
  const entries: { id: string; title: string }[] = [];
  let pageToken: string | undefined;
  do {
    const itemsRes = await yt.playlistItems.list({
      part: ["snippet"],
      playlistId,
      maxResults: 50,
      pageToken,
    });

    for (const item of itemsRes.data.items ?? []) {
      const videoId = item.snippet?.resourceId?.videoId;
      if (videoId) {
        entries.push({ id: videoId, title: item.snippet?.title ?? "Untitled" });
      }
    }

    pageToken = itemsRes.data.nextPageToken ?? undefined;
  } while (pageToken);

  if (entries.length === 0) {
    throw new Error(`Playlist is empty: ${playlistId}`);
  }

  // Fetch durations in batches of 50 via the videos endpoint
  const durationsById = new Map<string, number>();
  for (let i = 0; i < entries.length; i += 50) {
    const batch = entries.slice(i, i + 50).map((e) => e.id);
    const videosRes = await yt.videos.list({
      part: ["contentDetails"],
      id: batch,
    });

    for (const video of videosRes.data.items ?? []) {
      const iso = video.contentDetails?.duration;
      if (video.id && iso) {
        durationsById.set(video.id, Math.round(toSeconds(parse(iso))));
      }
    }
  }

  const videos: PlaylistVideo[] = entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    durationSeconds: durationsById.get(entry.id) ?? 0,
  }));

  const totalSeconds = videos.reduce((sum, v) => sum + v.durationSeconds, 0);

  return {
    playlistTitle,
    totalVideos: videos.length,
    totalSeconds,
    videos,
  };
}
