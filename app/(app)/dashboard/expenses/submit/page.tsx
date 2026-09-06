import { requireAdminContext } from "@/lib/auth/session";
import { getPhaseOptionsForOrg } from "@/lib/data/phases";
import { SubmitExpenseForm } from "@/components/dashboard/SubmitExpenseForm";

export default async function SubmitExpensePage() {
  const context = await requireAdminContext();
  const projects = await getPhaseOptionsForOrg(context.orgId);

  return (
    <div className="mx-auto min-h-screen w-full max-w-[390px] bg-surface">
      <header className="flex items-center gap-2 border-b border-hairline px-[18px] py-3.5">
        <span className="text-sm font-semibold text-ink">Log an expense</span>
      </header>
      <div className="px-[18px] py-[18px]">
        <SubmitExpenseForm projects={projects} />
      </div>
    </div>
  );
}
