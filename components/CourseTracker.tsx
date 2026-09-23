"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MOCK_USER_ID } from "@/lib/mock-user";
import { formatDuration } from "@/lib/format";
import type { CourseDetails } from "@/lib/types";

const TIME_LOG_OPTIONS = [5, 15, 30];

export default function CourseTracker({ courseId }: { courseId: string }) {
  const [details, setDetails] = useState<CourseDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/course/${courseId}?userId=${MOCK_USER_ID}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load course");
      setDetails(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load course");
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateProgress(
    moduleId: string,
    body: { completed?: boolean; addSeconds?: number }
  ) {
    setPendingId(moduleId);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: MOCK_USER_ID, moduleId, ...body }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update progress");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update progress");
    } finally {
      setPendingId(null);
    }
  }

  if (error && !details) {
    return (
      <div className="w-full max-w-2xl rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        Loading course...
      </div>
    );
  }

  const { course, modules } = details;
  const percent =
    course.totalModules > 0
      ? Math.round((course.completedModules / course.totalModules) * 100)
      : 0;

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <Link
          href="/"
          className="text-sm text-gray-400 transition hover:text-emerald-400"
        >
          &larr; All courses
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">{course.title}</h1>
        <div className="mt-3 flex flex-wrap gap-6 text-sm text-gray-300">
          <span>
            <span className="font-semibold text-emerald-400">
              {course.completedModules}
            </span>
            /{course.totalModules} videos watched
          </span>
          <span>
            <span className="font-semibold text-emerald-400">
              {formatDuration(course.watchedSeconds)}
            </span>{" "}
            of {formatDuration(course.totalSeconds)} logged
          </span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <ul className="space-y-2">
        {modules.map((module) => {
          const busy = pendingId === module.id;
          return (
            <li
              key={module.id}
              className={`rounded-lg border p-3 transition ${
                module.completed
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-gray-800 bg-gray-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    updateProgress(module.id, {
                      completed: !module.completed,
                    })
                  }
                  aria-label={
                    module.completed ? "Mark as not watched" : "Mark as watched"
                  }
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition disabled:opacity-50 ${
                    module.completed
                      ? "border-emerald-500 bg-emerald-500 text-gray-950"
                      : "border-gray-600 text-transparent hover:border-emerald-500"
                  }`}
                >
                  &#10003;
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm ${
                      module.completed
                        ? "text-gray-400 line-through"
                        : "text-white"
                    }`}
                  >
                    {module.orderIndex + 1}. {module.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDuration(module.durationSeconds)}
                    {module.secondsWatched > 0 &&
                      ` · ${formatDuration(module.secondsWatched)} logged`}
                  </p>
                </div>
                {!module.completed && (
                  <div className="flex shrink-0 gap-1">
                    {TIME_LOG_OPTIONS.map((minutes) => (
                      <button
                        key={minutes}
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          updateProgress(module.id, {
                            addSeconds: minutes * 60,
                          })
                        }
                        className="rounded-md border border-gray-700 px-2 py-1 text-xs text-gray-300 transition hover:border-emerald-500 hover:text-emerald-400 disabled:opacity-50"
                      >
                        +{minutes}m
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
