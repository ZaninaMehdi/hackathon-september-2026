import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { ReceiptThumb } from "@/components/ui/ReceiptThumb";
import { ExpenseDetailActions } from "@/components/dashboard/ExpenseDetailActions";
import { requireMemberContext } from "@/lib/auth/session";
import { getExpenseDetail } from "@/lib/data/expense";
import { getPhaseOptionsForProject } from "@/lib/data/phases";
import { formatUsd } from "@/lib/mock/project";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ expenseId: string }>;
}) {
  const { expenseId } = await params;
  const context = await requireMemberContext();
  const expense = await getExpenseDetail(expenseId, context.orgId);

  if (!expense) notFound();

  const canManage = context.roles.some((r) => r === "admin" || r === "treasurer");
  const phases = canManage ? await getPhaseOptionsForProject(expense.projectId) : [];

  return (
    <div className="mx-auto w-full max-w-[460px] bg-surface">
      <header className="flex items-center gap-3 border-b border-hairline px-[18px] py-4">
        <h1 className="font-display text-head font-bold tracking-[-0.02em] text-ink">
          Expense · #{expenseId.slice(0, 8)}
        </h1>
        <Badge variant="approved" className="ml-auto">
          Logged
        </Badge>
      </header>

      <div className="flex flex-col gap-4 px-[18px] py-[18px]">
        <div className="flex gap-3.5">
          {expense.receiptUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={expense.receiptUrl}
              alt="Receipt"
              className="h-[140px] w-[112px] shrink-0 rounded-md object-cover"
            />
          ) : (
            <ReceiptThumb size={112} radius="rounded-md" large className="!h-[140px]" />
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <h2 className="text-subhead font-bold tracking-[-0.02em] text-ink">{expense.title}</h2>
            <div className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1 text-meta">
              <span className="text-muted">Amount</span>
              <span className="font-mono text-ink">{formatUsd(expense.amount)}</span>
              {expense.vendor && (
                <>
                  <span className="text-muted">Vendor</span>
                  <span className="text-ink">{expense.vendor}</span>
                </>
              )}
              <span className="text-muted">Phase</span>
              <span className="text-ink">{expense.phaseLabel}</span>
              <span className="text-muted">Logged by</span>
              <span className="text-ink">
                {expense.submittedByEmail} · {expense.submittedDate}
              </span>
              {expense.updatedDate && (
                <>
                  <span className="text-muted">Edited by</span>
                  <span className="text-ink">
                    {expense.updatedByEmail} · {expense.updatedDate}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {canManage && <ExpenseDetailActions expense={expense} phases={phases} />}
      </div>
    </div>
  );
}
