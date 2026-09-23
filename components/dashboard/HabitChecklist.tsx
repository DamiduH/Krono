"use client";

import { useState } from "react";
import { MOCK_USER_ID } from "@/lib/mock-user";
import type { DashboardHabit } from "@/lib/types";

export default function HabitChecklist({
  habits,
  onRefresh,
}: {
  habits: DashboardHabit[];
  onRefresh: () => void;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(habit: DashboardHabit) {
    const done = habit.minutesToday > 0;
    setPendingId(habit.id);
    setError(null);
    try {
      const res = await fetch("/api/os/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: MOCK_USER_ID,
          habitId: habit.id,
          completed: !done,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Habit log failed");
      }
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Habit log failed");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
        Habit checklist
      </h2>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {habits.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No habits yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {habits.map((habit) => {
            const done = habit.minutesToday > 0;
            const busy = pendingId === habit.id;
            return (
              <li key={habit.id} className="flex items-center gap-3">
                {habit.isNegative ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => toggle(habit)}
                    aria-label={done ? "Remove strike" : "Strike habit"}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition disabled:opacity-50 ${
                      done
                        ? "border-red-500 bg-red-500 text-gray-950"
                        : "border-red-500/50 text-red-400 hover:bg-red-500/10"
                    }`}
                  >
                    &#10005;
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => toggle(habit)}
                    aria-label={done ? "Uncheck habit" : "Check habit"}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border text-xs font-bold transition disabled:opacity-50 ${
                      done
                        ? "border-emerald-500 bg-emerald-500 text-gray-950"
                        : "border-gray-600 text-transparent hover:border-emerald-500"
                    }`}
                  >
                    &#10003;
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm ${
                      done ? "text-gray-400 line-through" : "text-white"
                    }`}
                  >
                    {habit.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {habit.isNegative
                      ? done
                        ? "struck today"
                        : "keep it clean today"
                      : `${habit.minutesToday}/${habit.targetMinutes}m`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
