"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MOCK_USER_ID } from "@/lib/mock-user";
import { formatDuration } from "@/lib/format";

interface ResumeItem {
  moduleId: string;
  courseId: string;
  title: string;
  durationSeconds: number;
  secondsWatched: number;
}

export default function ContinueLearningWidget() {
  const [resume, setResume] = useState<ResumeItem | null | undefined>(
    undefined
  );

  useEffect(() => {
    fetch(`/api/os/continue-learning?userId=${MOCK_USER_ID}`)
      .then((res) => res.json())
      .then((data) => setResume(data.resume ?? null))
      .catch(() => setResume(null));
  }, []);

  const remaining = resume
    ? Math.max(0, resume.durationSeconds - resume.secondsWatched)
    : 0;

  return (
    <section className="flex flex-col justify-between rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Continue learning
        </h2>
        {resume === undefined ? (
          <p className="mt-3 text-sm text-gray-500">Loading...</p>
        ) : resume === null ? (
          <p className="mt-3 text-sm text-gray-500">
            Nothing in progress. Log some watch time to pick up where you left
            off.
          </p>
        ) : (
          <div className="mt-3">
            <p className="font-medium text-white">{resume.title}</p>
            <p className="mt-1 text-sm text-gray-400">
              {formatDuration(remaining)} left ·{" "}
              {formatDuration(resume.secondsWatched)} watched
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (resume.secondsWatched / resume.durationSeconds) * 100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
      {resume && (
        <Link
          href={`/course/${resume.courseId}`}
          className="mt-4 inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
        >
          Resume
        </Link>
      )}
    </section>
  );
}
