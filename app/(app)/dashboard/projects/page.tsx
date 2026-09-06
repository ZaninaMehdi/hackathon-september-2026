import Link from "next/link";
import { requireMemberContext } from "@/lib/auth/session";
import { getOrgProjects } from "@/lib/data/dashboard";
import { formatUsd } from "@/lib/mock/project";
import { NewProjectButton } from "@/components/dashboard/NewProjectButton";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function ProjectsListPage() {
  const context = await requireMemberContext();
  const projects = await getOrgProjects(context.orgId);
  const canManage = context.roles.some((r) => r === "admin" || r === "treasurer");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[600px] flex-col gap-4 bg-surface px-[18px] py-6">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-head font-bold tracking-[-0.02em] text-ink">Projects</h1>
        {canManage && (
          <NewProjectButton className={buttonClasses({ size: "sm", className: "ml-auto" })}>
            New project
          </NewProjectButton>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon="projects"
          title="No projects yet"
          description="Create a project and break it into phases to start tracking donations and expenses."
          action={
            canManage ? (
              <NewProjectButton className={buttonClasses({ size: "lg" })}>
                Create a project
              </NewProjectButton>
            ) : null
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="flex items-center gap-3 rounded-lg border border-hairline bg-white p-4 hover:bg-surface-sunken"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-copy font-semibold text-ink">{project.title}</span>
                  {project.status === "closed" && (
                    <Badge variant="draft" compact className="shrink-0">
                      closed
                    </Badge>
                  )}
                  {project.isZakatEligible && (
                    <Badge variant="confirmed" compact className="shrink-0">
                      Zakat-eligible
                    </Badge>
                  )}
                </div>
                <span className="text-meta text-muted">
                  Created {new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <span className="ml-auto font-mono text-sm text-ink">
                {formatUsd(project.totalGoal)} goal
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
