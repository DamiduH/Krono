import Link from "next/link";
import { getDomainProgress } from "@/lib/domains";
import { MOCK_USER_ID } from "@/lib/mock-user";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import GoalTimeline from "@/components/dashboard/GoalTimeline";

export default async function Page() {
  let domainProgress: Awaited<ReturnType<typeof getDomainProgress>> = [];
  let progressError: string | null = null;
  try {
    domainProgress = await getDomainProgress(MOCK_USER_ID);
  } catch (e) {
    progressError = e instanceof Error ? e.message : "RPC failed";
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Today at a glance: learning, habits and master goals.
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 text-sm text-gray-400 transition hover:text-emerald-400"
          >
            &larr; Life OS home
          </Link>
        </header>

        <DashboardGrid />

        {progressError ? (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {progressError}
          </div>
        ) : (
          <GoalTimeline rows={domainProgress} />
        )}
      </div>
    </main>
  );
}
