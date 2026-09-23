"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MOCK_USER_ID } from "@/lib/mock-user";
import { formatDuration } from "@/lib/format";
import type { CourseSummary } from "@/lib/types";

export default function CourseList() {
  const [courses, setCourses] = useState<CourseSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses?userId=${MOCK_USER_ID}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load courses");
      setCourses(data.courses);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load courses");
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("courses-changed", load);
    return () => window.removeEventListener("courses-changed", load);
  }, [load]);

  if (error) {
    return (
      <div className="w-full max-w-xl rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (!courses || courses.length === 0) return null;

  return (
    <div className="w-full max-w-xl space-y-3">
      <h2 className="text-lg font-semibold text-white">Your courses</h2>
      {courses.map((course) => {
        const percent =
          course.totalModules > 0
            ? Math.round((course.completedModules / course.totalModules) * 100)
            : 0;
        return (
          <Link
            key={course.id}
            href={`/course/${course.id}`}
            className="block rounded-lg border border-gray-800 bg-gray-900 p-4 transition hover:border-emerald-500/50"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="truncate font-medium text-white">
                {course.title}
              </h3>
              <span className="shrink-0 text-sm font-semibold text-emerald-400">
                {percent}%
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="mt-2 flex gap-6 text-xs text-gray-400">
              <span>
                {course.completedModules}/{course.totalModules} videos watched
              </span>
              <span>
                {formatDuration(course.watchedSeconds)} of{" "}
                {formatDuration(course.totalSeconds)}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
