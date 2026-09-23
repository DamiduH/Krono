"use client";

import { useState } from "react";
import { MOCK_USER_ID } from "@/lib/mock-user";
import { formatDuration } from "@/lib/format";

const FOCUS_OPTIONS = [25, 60];

export default function FocusWidget({
  focusMinutesToday,
  onRefresh,
}: {
  focusMinutesToday: number;
  onRefresh: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function log(minutes: number) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/os/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: MOCK_USER_ID, minutes }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to log focus time");
      }
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to log focus time");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
        Focus today
      </h2>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      <p className="mt-3 text-3xl font-bold text-white">
        {formatDuration(focusMinutesToday * 60)}
      </p>
      <p className="text-xs text-gray-500">{focusMinutesToday} minutes logged</p>
      <div className="mt-3 flex gap-2">
        {FOCUS_OPTIONS.map((minutes) => (
          <button
            key={minutes}
            type="button"
            disabled={pending}
            onClick={() => log(minutes)}
            className="rounded-md border border-gray-700 px-3 py-1.5 text-sm text-gray-300 transition hover:border-emerald-500 hover:text-emerald-400 disabled:opacity-50"
          >
            +{minutes}m
          </button>
        ))}
      </div>
    </section>
  );
}
