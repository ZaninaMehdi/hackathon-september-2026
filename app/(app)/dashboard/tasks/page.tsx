import { requireMemberContext } from "@/lib/auth/session";
import { getOrgTasks } from "@/lib/data/tasks";
import { TasksBoard } from "@/components/dashboard/TasksBoard";

export default async function TasksPage() {
  const context = await requireMemberContext();
  const tasks = await getOrgTasks(context.orgId);
  const canManage = context.roles.some((r) => r === "admin" || r === "treasurer");

  return (
    <>
      <div className="flex items-center gap-4 border-b border-hairline px-4 py-4.5 min-[900px]:px-6">
        <div className="flex flex-col">
          <h1 className="font-display text-head font-bold tracking-[-0.02em] text-ink">Tasks</h1>
          <span className="text-meta text-body">
            Internal only — tasks from every project&apos;s phases, never shown to donors.
          </span>
        </div>
      </div>

      <div className="p-4 min-[900px]:p-6">
        <TasksBoard tasks={tasks} canManage={canManage} />
      </div>
    </>
  );
}
