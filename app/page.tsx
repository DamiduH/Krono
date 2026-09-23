import CourseList from "@/components/CourseList";
import ImportCourseForm from "@/components/ImportCourseForm";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-gray-950 px-4 py-16">
      <div className="flex w-full max-w-xl flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Course Tracker
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Import a YouTube playlist to start tracking your learning progress.
          </p>
        </div>
        <ImportCourseForm />
      </div>
      <CourseList />
    </main>
  );
}
