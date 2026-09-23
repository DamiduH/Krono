"use client";

import { useCallback, useEffect, useState } from "react";
import { MOCK_USER_ID } from "@/lib/mock-user";
import type { DashboardData } from "@/lib/types";
import DomainsWidget from "@/components/os/DomainsWidget";
import HabitsWidget from "@/components/os/HabitsWidget";
import TasksWidget from "@/components/os/TasksWidget";
import FocusWidget from "@/components/os/FocusWidget";

export default function OsDashboard() {
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

  if (error && !data) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <DomainsWidget domains={data.domains} />
      <div className="flex flex-col gap-4">
        <FocusWidget
          focusMinutesToday={data.focusMinutesToday}
          onRefresh={load}
        />
        <HabitsWidget habits={data.habits} onRefresh={load} />
      </div>
      <div className="md:col-span-2">
        <TasksWidget
          tasks={data.tasks}
          domains={data.domains}
          onRefresh={load}
        />
      </div>
    </div>
  );
}
