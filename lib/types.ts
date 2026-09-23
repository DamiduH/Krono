export interface CourseSummary {
  id: string;
  title: string;
  totalModules: number;
  totalSeconds: number;
  completedModules: number;
  watchedSeconds: number;
}

export interface CourseModule {
  id: string;
  title: string;
  durationSeconds: number;
  orderIndex: number;
  completed: boolean;
  secondsWatched: number;
}

export interface CourseDetails {
  course: CourseSummary;
  modules: CourseModule[];
}
