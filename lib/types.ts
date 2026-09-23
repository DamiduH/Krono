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

export interface DashboardProject {
  id: string;
  title: string;
  status: "active" | "completed";
  tasksTotal: number;
  tasksCompleted: number;
}

export interface DashboardDomain {
  id: string;
  title: string;
  targetHours: number;
  deadline: string | null;
  watchedSeconds: number;
  projects: DashboardProject[];
}

export interface DashboardHabit {
  id: string;
  title: string;
  isNegative: boolean;
  targetMinutes: number;
  minutesToday: number;
}

export interface DashboardTask {
  id: string;
  title: string;
  dueDate: string | null;
  projectTitle: string;
  source: "manual" | "moodle";
}

export interface DashboardData {
  domains: DashboardDomain[];
  habits: DashboardHabit[];
  tasks: DashboardTask[];
  focusMinutesToday: number;
}
