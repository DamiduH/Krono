"use client";

import { useState } from "react";
import { MOCK_USER_ID } from "@/lib/mock-user";
import { formatDuration } from "@/lib/format";

interface ImportResult {
  title: string;
  totalVideos: number;
  totalSeconds: number;
}

export default function ImportCourseForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/course/import-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistUrl: url, userId: MOCK_USER_ID }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Import failed");
        return;
      }

      setResult({
        title: data.title,
        totalVideos: data.totalVideos,
        totalSeconds: data.totalSeconds,
      });
      window.dispatchEvent(new Event("courses-changed"));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-xl space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label
          htmlFor="playlist-url"
          className="block text-sm font-medium text-gray-300"
        >
          YouTube playlist URL
        </label>
        <div className="flex gap-2">
          <input
            id="playlist-url"
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/playlist?list=..."
            className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Importing..." : "Import"}
          </button>
        </div>
      </form>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Fetching playlist details and saving your course...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
          <h3 className="font-semibold text-white">{result.title}</h3>
          <div className="mt-2 flex gap-6 text-sm text-gray-300">
            <span>
              <span className="font-medium text-emerald-400">
                {result.totalVideos}
              </span>{" "}
              videos
            </span>
            <span>
              <span className="font-medium text-emerald-400">
                {formatDuration(result.totalSeconds)}
              </span>{" "}
              total
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Course imported successfully!
          </p>
        </div>
      )}
    </div>
  );
}
