"use client";

import type { DashboardDomain } from "@/lib/types";

function DeadlineChip({ deadline }: { deadline: string | null }) {
  if (!deadline) return null;
  const days = Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / 86_400_000
  );
  const label =
    days < 0 ? `${-days}d overdue` : days === 0 ? "due today" : `${days}d left`;
  const cls =
    days < 0
      ? "border-red-500/40 bg-red-500/10 text-red-400"
      : days <= 7
        ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
        : "border-gray-700 bg-gray-800/50 text-gray-400";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${cls}`}>
      {label}
    </span>
  );
}

export default function DomainsWidget({
  domains,
}: {
  domains: DashboardDomain[];
}) {
  return (
    <section className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
        Domains
      </h2>
      {domains.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No domains yet.</p>
      ) : (
        <ul className="mt-3 space-y-4">
          {domains.map((domain) => (
            <li key={domain.id}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate font-medium text-white">
                  {domain.title}
                </h3>
                <DeadlineChip deadline={domain.deadline} />
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${
                      domain.targetHours > 0
                        ? Math.min(
                            100,
                            Math.round(
                              (domain.watchedSeconds / 3600 / domain.targetHours) * 100
                            )
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {(domain.watchedSeconds / 3600).toFixed(1)}h of{" "}
                {domain.targetHours}h target
              </p>
              <ul className="mt-2 space-y-1">
                {domain.projects.map((project) => (
                  <li
                    key={project.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          project.status === "active"
                            ? "bg-emerald-500"
                            : "bg-gray-600"
                        }`}
                      />
                      <span className="truncate text-gray-300">
                        {project.title}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-gray-500">
                      {project.tasksCompleted}/{project.tasksTotal} tasks
                    </span>
                  </li>
                ))}
                {domain.projects.length === 0 && (
                  <li className="text-xs text-gray-600">No projects yet.</li>
                )}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
