import type { TaskStatus } from "@/lib/data/tasks";

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

const ORDER: TaskStatus[] = ["todo", "in_progress", "done"];

export function nextTaskStatus(status: TaskStatus): TaskStatus {
  const i = ORDER.indexOf(status);
  return ORDER[(i + 1) % ORDER.length];
}
