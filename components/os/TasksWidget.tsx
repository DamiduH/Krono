"use client";

import { useState } from "react";
import { MOCK_USER_ID } from "@/lib/mock-user";
import type { DashboardDomain, DashboardTask } from "@/lib/types";

function DueChip({ dueDate }: { dueDate: string | null }) {
  if (!dueDate) return null;
  const days = Math.ceil(
    (new Date(dueDate).getTime() - Date.now()) / 86_400_000
  );
  const label =
    days < 0 ? `${-days}d overdue` : days === 0 ? "today" : `in ${days}d`;
  const cls =
    days < 0
      ? "border-red-500/40 bg-red-500/10 text-red-400"
      : days <= 2
        ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
        : "border-gray-700 bg-gray-800/50 text-gray-400";
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${cls}`}>
      {label}
    </span>
  );
}

export default function TasksWidget({
  tasks,
  domains,
  onRefresh,
}: {
  tasks: DashboardTask[];
  domains: DashboardDomain[];
  onRefresh: () => void;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncUrl, setSyncUrl] = useState("");
  const [syncProjectId, setSyncProjectId] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const projects = domains.flatMap((d) => d.projects);

  async function syncMoodle(e: React.FormEvent) {
    e.preventDefault();
    if (!syncProjectId) {
      setError("Pick a project for the synced assignments");
      return;
    }
    setSyncing(true);
    setError(null);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/sync/moodle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: MOCK_USER_ID,
          projectId: syncProjectId,
          icsUrl: syncUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Calendar sync failed");
      setSyncMessage(
        `Synced: ${data.added} added, ${data.updated} updated`
      );
      onRefresh();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Calendar sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function toggle(task: DashboardTask) {
    setPendingId(task.id);
    setError(null);
    try {
      const res = await fetch(`/api/os/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Task update failed");
      }
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Task update failed");
    } finally {
      setPendingId(null);
    }
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) {
      setError("Pick a project for the new task");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/os/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: MOCK_USER_ID,
          projectId,
          title,
          dueDate: dueDate || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to add task");
      }
      setTitle("");
      setDueDate("");
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
        Upcoming tasks
      </h2>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {tasks.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">Nothing due. Add a task below.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {tasks.map((task) => {
            const busy = pendingId === task.id;
            return (
              <li key={task.id} className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => toggle(task)}
                  aria-label="Mark task complete"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-gray-600 text-xs font-bold text-transparent transition hover:border-emerald-500 disabled:opacity-50"
                >
                  &#10003;
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{task.title}</p>
                  <p className="truncate text-xs text-gray-500">
                    {task.projectTitle}
                    {task.source === "moodle" && (
                      <span className="ml-2 rounded border border-sky-500/40 bg-sky-500/10 px-1 py-px text-[10px] text-sky-400">
                        moodle
                      </span>
                    )}
                  </p>
                </div>
                <DueChip dueDate={task.dueDate} />
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={addTask} className="mt-4 space-y-2 border-t border-gray-800 pt-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="New task..."
          className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-emerald-500"
        />
        <div className="flex gap-2">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-gray-700 bg-gray-950 px-2 py-1.5 text-sm text-gray-300 outline-none focus:border-emerald-500"
          >
            <option value="">Project...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-md border border-gray-700 bg-gray-950 px-2 py-1.5 text-sm text-gray-300 outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </form>

      <form
        onSubmit={syncMoodle}
        className="mt-3 space-y-2 border-t border-gray-800 pt-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Moodle calendar sync
        </p>
        <input
          value={syncUrl}
          onChange={(e) => setSyncUrl(e.target.value)}
          required
          type="url"
          placeholder="https://moodle.example.edu/calendar/ics.ics"
          className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-emerald-500"
        />
        <div className="flex gap-2">
          <select
            value={syncProjectId}
            onChange={(e) => setSyncProjectId(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-gray-700 bg-gray-950 px-2 py-1.5 text-sm text-gray-300 outline-none focus:border-emerald-500"
          >
            <option value="">Sync into project...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={syncing}
            className="rounded-md border border-sky-500/50 bg-sky-500/10 px-3 py-1.5 text-sm font-semibold text-sky-400 transition hover:bg-sky-500/20 disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync"}
          </button>
        </div>
        {syncMessage && <p className="text-xs text-emerald-400">{syncMessage}</p>}
      </form>
    </section>
  );
}
