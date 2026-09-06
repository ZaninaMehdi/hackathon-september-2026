import { requireAdminContext } from "@/lib/auth/session";
import { InviteForm } from "@/components/dashboard/InviteForm";

export default async function InvitePage() {
  await requireAdminContext();
  return <InviteForm />;
}
