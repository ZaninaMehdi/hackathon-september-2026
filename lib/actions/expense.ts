"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type SubmitExpenseInput = {
  projectId: string;
  phaseId: string;
  description: string;
  vendor: string;
  amount: number;
  receiptFile: File;
};

export async function submitExpense(input: SubmitExpenseInput) {
  const context = await requireAdminContext();

  // Uploaded with the admin client (bypasses storage RLS) rather than the
  // visitor's own browser session — this keeps working the same way whether
  // real auth is on or the DISABLE_AUTH dev bypass is active, since either
  // way the permission check already happened above via requireAdminContext.
  const admin = createAdminClient();
  const path = `${input.projectId}/${Date.now()}-${input.receiptFile.name}`;
  const { error: uploadError } = await admin.storage
    .from("receipts")
    .upload(path, input.receiptFile);

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("receipts").getPublicUrl(path);

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
      receipt_url: publicUrl,
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

async function assertOwnsExpense(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  expenseId: string
) {
  const { data: expense } = await supabase
    .from("expenses")
    .select("id, org_id")
    .eq("id", expenseId)
    .maybeSingle();

  if (!expense || expense.org_id !== orgId) {
    throw new Error("Expense not found.");
  }
}

export type UpdateExpenseInput = {
  expenseId: string;
  phaseId: string;
  description: string;
  vendor: string;
  amount: number;
  receiptFile: File | null;
};

export async function updateExpense(input: UpdateExpenseInput) {
  const context = await requireAdminContext();
  const supabase = await createClient();

  await assertOwnsExpense(supabase, context.orgId, input.expenseId);

  let receiptUrl: string | undefined;
  if (input.receiptFile) {
    const admin = createAdminClient();
    const path = `${input.expenseId}/${Date.now()}-${input.receiptFile.name}`;
    const { error: uploadError } = await admin.storage
      .from("receipts")
      .upload(path, input.receiptFile);
    if (uploadError) throw new Error(uploadError.message);
    receiptUrl = admin.storage.from("receipts").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await supabase
    .from("expenses")
    .update({
      phase_id: input.phaseId,
      description: input.description,
      vendor: input.vendor || null,
      amount: input.amount,
      ...(receiptUrl ? { receipt_url: receiptUrl } : {}),
      updated_by: context.memberId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.expenseId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/expenses/${input.expenseId}`);
  revalidatePath("/dashboard");
}

export async function deleteExpense(expenseId: string) {
  const context = await requireAdminContext();
  const supabase = await createClient();

  await assertOwnsExpense(supabase, context.orgId, expenseId);

  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
  if (error) throw new Error(error.message);

  redirect("/dashboard");
}
