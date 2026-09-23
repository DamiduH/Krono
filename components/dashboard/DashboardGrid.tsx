"use client";

import { useCallback, useEffect, useState } from "react";
import { MOCK_USER_ID } from "@/lib/mock-user";
import type { DashboardData } from "@/lib/types";
import ContinueLearningWidget from "@/components/dashboard/ContinueLearningWidget";
import WatchTargetRing from "@/components/dashboard/WatchTargetRing";
import HabitChecklist from "@/components/dashboard/HabitChecklist";

export default function DashboardGrid() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/os/dashboard?userId=${MOCK_USER_ID}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load dashboard");
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error}
      </div>
    );
  }

  const minutesToday = data
    ? data.focusMinutesToday +
      data.habits.reduce((sum, h) => sum + h.minutesToday, 0)
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <ContinueLearningWidget />
      <WatchTargetRing minutes={minutesToday} />
      <div className="md:col-span-2 lg:col-span-1">
        {data ? (
          <HabitChecklist habits={data.habits} onRefresh={load} />
        ) : (
          <div className="flex h-full items-center rounded-lg border border-gray-800 bg-gray-900 p-4 text-sm text-gray-500">
            Loading habits...
          </div>
        )}
      </div>
    </div>
  );
}
