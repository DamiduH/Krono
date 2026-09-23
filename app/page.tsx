import OsDashboard from "@/components/OsDashboard";
import CourseList from "@/components/CourseList";
import ImportCourseForm from "@/components/ImportCourseForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Life OS
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Domains, projects, habits and courses in one place.
            </p>
          </div>
          <a
            href="/dashboard"
            className="shrink-0 text-sm text-gray-400 transition hover:text-emerald-400"
          >
            Dashboard &rarr;
          </a>
        </header>

        <OsDashboard />

        <section className="flex flex-col gap-6 border-t border-gray-800 pt-8">
          <ImportCourseForm />
          <CourseList />
        </section>
      </div>
    </main>
  );
}
