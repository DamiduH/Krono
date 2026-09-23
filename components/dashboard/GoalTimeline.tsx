import type { DomainProgress } from "@/lib/domains";

export default function GoalTimeline({ rows }: { rows: DomainProgress[] }) {
  return (
    <section className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
        Master goal timeline
      </h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No domains yet.</p>
      ) : (
        <ul className="mt-4 space-y-5">
          {rows.map((row) => {
            const watchedHours = row.total_video_seconds / 3600;
            const pct =
              row.target_hours > 0
                ? Math.min(100, Math.round((watchedHours / row.target_hours) * 100))
                : 0;
            return (
              <li key={row.domain_id}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate font-medium text-white">
                    {row.domain_title}
                  </p>
                  <p className="shrink-0 text-xs text-gray-400">
                    {watchedHours.toFixed(1)}h / {row.target_hours}h ·{" "}
                    {row.completed_task_count} tasks done
                  </p>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-xs font-semibold text-emerald-400">
                  {pct}%
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
