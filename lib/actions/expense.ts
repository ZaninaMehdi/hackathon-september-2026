"use server";

import { redirect } from "next/navigation";
import { requireAdminContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type SubmitExpenseInput = {
  projectId: string;
  phaseId: string;
  description: string;
  vendor: string;
  amount: number;
  receiptUrl: string;
};

export async function submitExpense(input: SubmitExpenseInput) {
  const context = await requireAdminContext();
  const supabase = await createClient();

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      org_id: context.orgId,
      project_id: input.projectId,
      phase_id: input.phaseId,
      description: input.description,
      vendor: input.vendor || null,
      amount: input.amount,
      receipt_url: input.receiptUrl,
      status: "approved",
      submitted_by: context.memberId,
    })
    .select("id")
    .single();

  if (error || !expense) {
    throw new Error(error?.message ?? "Failed to log expense.");
  }

  redirect(`/dashboard/expenses/${expense.id}`);
}
