import { notFound } from "next/navigation";
import { requireMemberContext } from "@/lib/auth/session";
import { getOrgProfile, getOrgMembers } from "@/lib/data/organization";
import { OrgProfileForm } from "@/components/dashboard/OrgProfileForm";
import { TeamMembersList } from "@/components/dashboard/TeamMembersList";
import { MemberPreferencesForm } from "@/components/dashboard/MemberPreferencesForm";

export default async function SettingsPage() {
  const context = await requireMemberContext();
  const canManage = context.roles.some((r) => r === "admin" || r === "treasurer");

  const [profile, members] = await Promise.all([
    getOrgProfile(context.orgId),
    getOrgMembers(context.orgId),
  ]);

  if (!profile) notFound();

  const me = members.find((m) => m.id === context.memberId);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col gap-6 bg-surface px-[18px] py-6">
      <div>
        <h1 className="font-display text-head font-bold tracking-[-0.02em] text-ink">Settings</h1>
        <span className="text-meta text-body">Organization profile, team, and your preferences</span>
      </div>

      {canManage ? (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-subhead font-semibold text-ink">Masjid profile</h2>
          <OrgProfileForm profile={profile} />
        </section>
      ) : (
        <section className="flex flex-col gap-1 rounded-lg border border-hairline bg-surface-raised p-4">
          <span className="text-copy font-semibold text-ink">{profile.name}</span>
          {profile.description && <p className="text-meta text-body">{profile.description}</p>}
        </section>
      )}

      <section className="flex flex-col gap-2.5">
        <h2 className="text-subhead font-semibold text-ink">Team</h2>
        <TeamMembersList members={members} currentMemberId={context.memberId} canManage={canManage} />
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="text-subhead font-semibold text-ink">Your preferences</h2>
        <MemberPreferencesForm
          emailNotificationsEnabled={me?.emailNotificationsEnabled ?? true}
        />
      </section>
    </div>
  );
}
