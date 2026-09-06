import { requireAdminContext } from "@/lib/auth/session";
import { NewProjectForm } from "@/components/dashboard/NewProjectForm";

export default async function NewProjectPage() {
  await requireAdminContext();
  return (
    <div className="mx-auto min-h-screen w-full max-w-[460px] bg-surface px-[18px] py-6">
      <h1 className="mb-4 text-xl font-bold tracking-[-0.02em] text-ink">New project</h1>
      <NewProjectForm />
    </div>
  );
}
