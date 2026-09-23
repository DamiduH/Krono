"use client";

import { useState } from "react";
import { MOCK_USER_ID } from "@/lib/mock-user";
import type { DashboardHabit } from "@/lib/types";

export default function HabitsWidget({
  habits,
  onRefresh,
}: {
  habits: DashboardHabit[];
  onRefresh: () => void;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkIn(
    habit: DashboardHabit,
    body: { completed?: boolean; minutes?: number }
  ) {
    setPendingId(habit.id);
    setError(null);
    try {
      const res = await fetch("/api/os/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: MOCK_USER_ID, habitId: habit.id, ...body }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Habit check-in failed");
      }
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Habit check-in failed");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
        Today&apos;s habits
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
              <li
                key={habit.id}
                className="flex items-center gap-3 rounded-md border border-gray-800 bg-gray-950/50 px-3 py-2"
              >
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    checkIn(habit, { completed: !done })
                  }
                  aria-label={done ? "Undo habit" : "Complete habit"}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition disabled:opacity-50 ${
                    done
                      ? "border-emerald-500 bg-emerald-500 text-gray-950"
                      : "border-gray-600 text-transparent hover:border-emerald-500"
                  }`}
                >
                  &#10003;
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm ${
                      done ? "text-gray-400 line-through" : "text-white"
                    }`}
                  >
                    {habit.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {habit.minutesToday}/{habit.targetMinutes}m
                    {habit.isNegative && " · avoid"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      checkIn(habit, {
                        minutes: Math.max(0, habit.minutesToday - 15),
                      })
                    }
                    className="rounded-md border border-gray-700 px-2 py-1 text-xs text-gray-300 transition hover:border-emerald-500 hover:text-emerald-400 disabled:opacity-50"
                  >
                    -15m
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      checkIn(habit, { minutes: habit.minutesToday + 15 })
                    }
                    className="rounded-md border border-gray-700 px-2 py-1 text-xs text-gray-300 transition hover:border-emerald-500 hover:text-emerald-400 disabled:opacity-50"
                  >
                    +15m
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
