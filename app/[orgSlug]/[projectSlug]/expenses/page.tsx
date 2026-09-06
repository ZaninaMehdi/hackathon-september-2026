import Link from "next/link";
import { ReceiptThumb } from "@/components/ui/ReceiptThumb";
import { Badge } from "@/components/ui/Badge";
import { formatUsd } from "@/lib/mock/project";
import { getProjectLedger } from "@/lib/data/project";

export default async function ProjectLedgerPage({
  params,
}: {
  params: Promise<{ orgSlug: string; projectSlug: string }>;
}) {
  const { orgSlug, projectSlug } = await params;
  const { org, project, entries } = await getProjectLedger(orgSlug, projectSlug);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col gap-4 bg-surface px-[18px] py-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/${orgSlug}/${projectSlug}`}
          className="text-[12.5px] font-semibold text-accent"
        >
          ← Back to {project.title}
        </Link>
        <h1 className="text-xl font-bold tracking-[-0.02em] text-ink">Approved expenses</h1>
        <p className="text-sm text-body">{org.name} · {entries.length} total</p>
      </div>

      {entries.length === 0 && (
        <p className="text-sm text-body">No approved expenses yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {entries.map((expense) => (
          <div
            key={expense.id}
            className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-raised p-3"
          >
            <ReceiptThumb size={44} radius="rounded-sm" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate font-sans text-[13.5px] font-semibold text-ink">
                {expense.title}
              </span>
              <span className="truncate text-[11.5px] text-body">
                {expense.phaseLabel} · {expense.date}
              </span>
              <Badge variant="approved" compact>
                Approved
              </Badge>
            </div>
            <span className="whitespace-nowrap font-mono text-sm font-medium text-ink">
              {formatUsd(expense.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
