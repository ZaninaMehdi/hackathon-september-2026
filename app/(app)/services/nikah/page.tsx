import { redirect } from "next/navigation";
import { requireMemberContext } from "@/lib/auth/session";

export default async function NikahPage() {
  const context = await requireMemberContext();
  redirect(`/${context.orgSlug}#services`);
}
