import CourseTracker from "@/components/CourseTracker";

export default async function Page(props: PageProps<"/course/[courseId]">) {
  const { courseId } = await props.params;
  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-950 px-4 py-16">
      <CourseTracker courseId={courseId} />
    </main>
  );
}
