import { createClient } from "@/lib/supabase/server";

export type ExpenseDetail = {
  id: string;
  title: string;
  vendor: string;
  amount: number;
  receiptUrl: string | null;
  phaseLabel: string;
  submittedByEmail: string;
  submittedDate: string;
};

export async function getExpenseDetail(expenseId: string, orgId: string): Promise<ExpenseDetail | null> {
  const supabase = await createClient();

  const { data: expense } = await supabase
    .from("expenses")
    .select("id, description, vendor, amount, receipt_url, phase_id, submitted_by, created_at, org_id")
    .eq("id", expenseId)
    .maybeSingle();

  if (!expense || expense.org_id !== orgId) return null;

  const [{ data: phase }, { data: submitter }] = await Promise.all([
    expense.phase_id
      ? supabase.from("phases").select("title").eq("id", expense.phase_id).maybeSingle()
      : Promise.resolve({ data: null }),
    expense.submitted_by
      ? supabase.from("members").select("email").eq("id", expense.submitted_by).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    id: expense.id,
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
  };
}
