import { createClient } from "@/lib/supabase/server";

export type ExpenseDetail = {
  id: string;
  projectId: string;
  phaseId: string | null;
  title: string;
  vendor: string;
  amount: number;
  receiptUrl: string | null;
  phaseLabel: string;
  submittedByEmail: string;
  submittedDate: string;
  updatedByEmail: string | null;
  updatedDate: string | null;
};

export async function getExpenseDetail(expenseId: string, orgId: string): Promise<ExpenseDetail | null> {
  const supabase = await createClient();

  const { data: expense } = await supabase
    .from("expenses")
    .select(
      "id, project_id, description, vendor, amount, receipt_url, phase_id, submitted_by, updated_by, updated_at, created_at, org_id"
    )
    .eq("id", expenseId)
    .maybeSingle();

  if (!expense || expense.org_id !== orgId) return null;

  const [{ data: phase }, { data: submitter }, { data: updater }] = await Promise.all([
    expense.phase_id
      ? supabase.from("phases").select("title").eq("id", expense.phase_id).maybeSingle()
      : Promise.resolve({ data: null }),
    expense.submitted_by
      ? supabase.from("members").select("email").eq("id", expense.submitted_by).maybeSingle()
      : Promise.resolve({ data: null }),
    expense.updated_by
      ? supabase.from("members").select("email").eq("id", expense.updated_by).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    id: expense.id,
    projectId: expense.project_id,
    phaseId: expense.phase_id,
    title: expense.description ?? "Expense",
    vendor: expense.vendor ?? "",
    amount: Number(expense.amount),
    receiptUrl: expense.receipt_url,
    phaseLabel: phase?.title ?? "",
    submittedByEmail: submitter?.email ?? "",
    submittedDate: new Date(expense.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    updatedByEmail: expense.updated_at ? (updater?.email ?? null) : null,
    updatedDate: expense.updated_at
      ? new Date(expense.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : null,
  };
}
