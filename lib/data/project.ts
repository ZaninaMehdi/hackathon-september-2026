import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/lib/actions/project";

export type PhaseStatus = "complete" | "in_progress" | "not_started" | "pending_approval";

export const getPublicOrgBySlug = cache(async function getPublicOrgBySlug(orgSlug: string) {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, description, logo_url, cover_image_url")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) notFound();

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    description: org.description,
    logoUrl: org.logo_url,
    coverImageUrl: org.cover_image_url,
  };
});

export type PublicPhase = {
  id: string;
  index: number;
  name: string;
  description: string;
  raised: number;
  target: number;
  status: PhaseStatus;
  caption: string;
};

export type PublicExpense = {
  id: string;
  title: string;
  phaseLabel: string;
  date: string;
  amount: number;
};

export type PublicProjectData = {
  org: { id: string; name: string; slug: string; logoUrl: string | null };
  project: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    status: ProjectStatus;
    isZakatEligible: boolean;
    coverImageUrl: string | null;
  };
  raised: number;
  goal: number;
  spent: number;
  activePhaseLabel: string;
  activePhaseId: string | null;
  phases: PublicPhase[];
  expenses: PublicExpense[];
  expensesTotal: number;
};

export type DonatablePhase = {
  id: string;
  label: string;
  raised: number;
  target: number;
  isComplete: boolean;
};

export type PublicProjectSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  raised: number;
  goal: number;
  phaseCount: number;
  isZakatEligible: boolean;
  coverImageUrl: string | null;
  activePhaseId: string | null;
  activePhaseLabel: string;
  phases: DonatablePhase[];
};

export type PublicOrgHome = {
  org: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    coverImageUrl: string | null;
  };
  projects: PublicProjectSummary[];
  totalRaised: number;
  totalGoal: number;
};

export type PublicOrgDirectoryItem = {
  id: string;
  name: string;
  slug: string;
  orgType: string | null;
  description: string | null;
  logoUrl: string | null;
  /** The org's own uploaded cover photo, or null. Never a campaign photo —
   *  a campaign image answers "what are we fundraising for", not "what is
   *  this organization", so the two must not be interchangeable. When null,
   *  OrgCard renders a branded placeholder instead. */
  coverImageUrl: string | null;
  activeCampaigns: number;
  totalRaised: number;
};

type PhaseProgressInput = {
  id: string;
  title: string;
  budget_target: number;
};

function resolveActivePhase(
  phases: PhaseProgressInput[],
  raisedByPhase: Map<string, number>
): { id: string; label: string } | null {
  const computed = phases.map((phase) => {
    const raised = raisedByPhase.get(phase.id) ?? 0;
    const target = Number(phase.budget_target);
    const complete = target > 0 && raised >= target;
    const status: PhaseStatus = complete ? "complete" : raised > 0 ? "in_progress" : "not_started";
    return { id: phase.id, label: phase.title, status };
  });

  return (
    computed.find((phase) => phase.status === "in_progress") ??
    computed.find((phase) => phase.status === "not_started") ??
    null
  );
}

export const getPublicOrganizations = cache(async function getPublicOrganizations(): Promise<
  PublicOrgDirectoryItem[]
> {
  const supabase = await createClient();

  const [{ data: orgs }, { data: projects }, { data: donations }] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, slug, org_type, description, logo_url, cover_image_url")
      .order("name"),
    supabase
      .from("projects")
      .select("org_id, status")
      .eq("status", "active"),
    supabase.from("donations").select("org_id, amount"),
  ]);

  const activeByOrg = new Map<string, number>();
  for (const project of projects ?? []) {
    activeByOrg.set(project.org_id, (activeByOrg.get(project.org_id) ?? 0) + 1);
  }

  const raisedByOrg = new Map<string, number>();
  for (const donation of donations ?? []) {
    raisedByOrg.set(donation.org_id, (raisedByOrg.get(donation.org_id) ?? 0) + Number(donation.amount));
  }

  return (orgs ?? []).map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    orgType: org.org_type ?? null,
    description: org.description ?? null,
    logoUrl: org.logo_url ?? null,
    coverImageUrl: org.cover_image_url ?? null,
    activeCampaigns: activeByOrg.get(org.id) ?? 0,
    totalRaised: raisedByOrg.get(org.id) ?? 0,
  }));
});

export type FeaturedCampaignExpense = {
  id: string;
  title: string;
  amount: number;
  hasReceipt: boolean;
};

export type FeaturedCampaign = {
  orgName: string;
  orgSlug: string;
  title: string;
  slug: string;
  raised: number;
  goal: number;
  phaseIndex: number;
  phaseCount: number;
  donorCount: number;
  expenses: FeaturedCampaignExpense[];
};

type FeaturedOrgJoin = { name: string; slug: string };

function unwrapOrg(org: FeaturedOrgJoin | FeaturedOrgJoin[] | null): FeaturedOrgJoin | null {
  if (!org) return null;
  return Array.isArray(org) ? (org[0] ?? null) : org;
}

/** The most-raised active campaign, for the landing hero card. */
export const getFeaturedPublicCampaign = cache(async function getFeaturedPublicCampaign(): Promise<
  FeaturedCampaign | null
> {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, slug, title, org_id, organizations(name, slug)")
    .eq("status", "active");

  if (!projects?.length) return null;

  const ids = projects.map((project) => project.id);
  const [{ data: donations }, { data: phases }, { data: expenses }] = await Promise.all([
    supabase.from("donations").select("project_id, amount, phase_id").in("project_id", ids),
    supabase
      .from("phases")
      .select("id, project_id, title, budget_target, sort_order")
      .in("project_id", ids)
      .order("sort_order", { ascending: true }),
    supabase
      .from("expenses")
      .select("id, project_id, description, amount, receipt_url, created_at")
      .in("project_id", ids)
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
  ]);

  const raisedByProject = new Map<string, number>();
  const donorsByProject = new Map<string, number>();
  const raisedByPhase = new Map<string, number>();
  for (const donation of donations ?? []) {
    raisedByProject.set(
      donation.project_id,
      (raisedByProject.get(donation.project_id) ?? 0) + Number(donation.amount),
    );
    donorsByProject.set(donation.project_id, (donorsByProject.get(donation.project_id) ?? 0) + 1);
    if (donation.phase_id) {
      raisedByPhase.set(
        donation.phase_id,
        (raisedByPhase.get(donation.phase_id) ?? 0) + Number(donation.amount),
      );
    }
  }

  const goalByProject = new Map<string, number>();
  const expenseCountByProject = new Map<string, number>();
  for (const phase of phases ?? []) {
    goalByProject.set(
      phase.project_id,
      (goalByProject.get(phase.project_id) ?? 0) + Number(phase.budget_target),
    );
  }
  for (const expense of expenses ?? []) {
    expenseCountByProject.set(
      expense.project_id,
      (expenseCountByProject.get(expense.project_id) ?? 0) + 1,
    );
  }

  // Prefer a campaign that still looks like a live fundraise. A stray test
  // donation of millions against a $372k goal would otherwise win on raw
  // raised and make the hero card read as broken.
  function score(projectId: string): number {
    const raised = raisedByProject.get(projectId) ?? 0;
    const goal = goalByProject.get(projectId) ?? 0;
    const expenses = expenseCountByProject.get(projectId) ?? 0;
    const outlier = goal > 0 && raised > goal * 2;
    if (outlier) return raised / 1_000_000;
    return raised + (expenses > 0 ? 1_000_000 : 0) + (goal > 0 ? 100_000 : 0);
  }

  const pick = [...projects].sort((a, b) => score(b.id) - score(a.id))[0];
  const org = unwrapOrg(pick.organizations as FeaturedOrgJoin | FeaturedOrgJoin[] | null);
  if (!org) return null;

  const projectPhases = (phases ?? []).filter((phase) => phase.project_id === pick.id);
  const active = resolveActivePhase(projectPhases, raisedByPhase);
  const activeIndex = active
    ? projectPhases.findIndex((phase) => phase.id === active.id) + 1
    : projectPhases.length;

  return {
    orgName: org.name,
    orgSlug: org.slug,
    title: pick.title,
    slug: pick.slug,
    raised: raisedByProject.get(pick.id) ?? 0,
    goal: projectPhases.reduce((sum, phase) => sum + Number(phase.budget_target), 0),
    phaseIndex: Math.max(activeIndex, 1),
    phaseCount: projectPhases.length,
    donorCount: donorsByProject.get(pick.id) ?? 0,
    expenses: (expenses ?? [])
      .filter((expense) => expense.project_id === pick.id)
      .slice(0, 3)
      .map((expense) => ({
        id: expense.id,
        title: expense.description ?? "Expense",
        amount: Number(expense.amount),
        hasReceipt: Boolean(expense.receipt_url),
      })),
  };
});

export const getPublicReceiptCoverage = cache(async function getPublicReceiptCoverage(): Promise<
  number
> {
  const supabase = await createClient();
  const { data } = await supabase.from("expenses").select("receipt_url");
  if (!data?.length) return 100;
  const withReceipt = data.filter((row) => Boolean(row.receipt_url)).length;
  return Math.round((withReceipt / data.length) * 100);
});

export const getPublicOrgHome = cache(async function getPublicOrgHome(
  orgSlug: string
): Promise<PublicOrgHome> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, description, logo_url, cover_image_url")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) notFound();

  const [{ data: projects }, { data: phases }, { data: donations }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, slug, title, description, status, is_zakat_eligible, cover_image_url")
      .eq("org_id", org.id)
      .neq("status", "archived")
      .order("created_at", { ascending: false }),
    supabase
      .from("phases")
      .select("id, project_id, title, budget_target, sort_order")
      .eq("org_id", org.id)
      .order("sort_order", { ascending: true }),
    supabase.from("donations").select("project_id, phase_id, amount").eq("org_id", org.id),
  ]);

  const goalByProject = new Map<string, number>();
  const phasesByProject = new Map<string, PhaseProgressInput[]>();
  for (const phase of phases ?? []) {
    goalByProject.set(
      phase.project_id,
      (goalByProject.get(phase.project_id) ?? 0) + Number(phase.budget_target)
    );
    const list = phasesByProject.get(phase.project_id) ?? [];
    list.push({ id: phase.id, title: phase.title, budget_target: Number(phase.budget_target) });
    phasesByProject.set(phase.project_id, list);
  }

  const raisedByProject = new Map<string, number>();
  const raisedByPhase = new Map<string, number>();
  for (const donation of donations ?? []) {
    raisedByProject.set(
      donation.project_id,
      (raisedByProject.get(donation.project_id) ?? 0) + Number(donation.amount)
    );
    if (donation.phase_id) {
      raisedByPhase.set(
        donation.phase_id,
        (raisedByPhase.get(donation.phase_id) ?? 0) + Number(donation.amount)
      );
    }
  }

  const projectSummaries: PublicProjectSummary[] = (projects ?? []).map((project) => {
    const projectPhases = phasesByProject.get(project.id) ?? [];
    const activePhase = resolveActivePhase(projectPhases, raisedByPhase);
    const donatablePhases: DonatablePhase[] = projectPhases.map((phase) => {
      const raised = raisedByPhase.get(phase.id) ?? 0;
      const target = Number(phase.budget_target);
      return {
        id: phase.id,
        label: phase.title,
        raised,
        target,
        isComplete: target > 0 && raised >= target,
      };
    });

    return {
      id: project.id,
      slug: project.slug,
      title: project.title,
      description: project.description,
      status: project.status as ProjectStatus,
      raised: raisedByProject.get(project.id) ?? 0,
      goal: goalByProject.get(project.id) ?? 0,
      phaseCount: projectPhases.length,
      isZakatEligible: project.is_zakat_eligible,
      coverImageUrl: project.cover_image_url,
      activePhaseId: activePhase?.id ?? null,
      activePhaseLabel: activePhase?.label ?? "",
      phases: donatablePhases,
    };
  });

  return {
    org: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      logoUrl: org.logo_url,
      coverImageUrl: org.cover_image_url,
    },
    projects: projectSummaries,
    totalRaised: projectSummaries.reduce((sum, p) => sum + p.raised, 0),
    totalGoal: projectSummaries.reduce((sum, p) => sum + p.goal, 0),
  };
});

export const getPublicProject = cache(async function getPublicProject(
  orgSlug: string,
  projectSlug: string
): Promise<PublicProjectData> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, logo_url")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) notFound();

  const { data: project } = await supabase
    .from("projects")
    .select("id, slug, title, description, status, org_id, is_zakat_eligible, cover_image_url")
    .eq("slug", projectSlug)
    .eq("org_id", org.id)
    .maybeSingle();

  if (!project) notFound();

  const [{ data: phaseRows }, { data: donationRows }, { data: expenseRows }] = await Promise.all([
    supabase
      .from("phases")
      .select("id, title, description, budget_target, sort_order")
      .eq("project_id", project.id)
      .order("sort_order", { ascending: true }),
    supabase.from("donations").select("amount, phase_id").eq("project_id", project.id),
    supabase
      .from("expenses")
      .select("id, description, amount, phase_id, created_at")
      .eq("project_id", project.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
  ]);

  const phases = phaseRows ?? [];
  const donations = donationRows ?? [];
  const expenses = expenseRows ?? [];

  const raisedByPhase = new Map<string, number>();
  let totalRaised = 0;
  for (const d of donations) {
    totalRaised += Number(d.amount);
    if (d.phase_id) {
      raisedByPhase.set(d.phase_id, (raisedByPhase.get(d.phase_id) ?? 0) + Number(d.amount));
    }
  }

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalGoal = phases.reduce((sum, p) => sum + Number(p.budget_target), 0);
  const phaseTitleById = new Map(phases.map((p) => [p.id, p.title]));

  const publicPhases: PublicPhase[] = phases.map((phase, i) => {
    const raised = raisedByPhase.get(phase.id) ?? 0;
    const target = Number(phase.budget_target);
    const complete = target > 0 && raised >= target;
    let status: PhaseStatus = "not_started";
    let caption = "not started";
    if (complete) {
      status = "complete";
      caption = "closed";
    } else if (raised > 0) {
      status = "in_progress";
      caption = "in progress";
    }
    return {
      id: phase.id,
      index: i + 1,
      name: phase.title,
      description: phase.description ?? "",
      raised,
      target,
      status,
      caption,
    };
  });

  const activePhase =
    publicPhases.find((p) => p.status === "in_progress") ??
    publicPhases.find((p) => p.status === "not_started") ??
    null;

  const publicExpenses: PublicExpense[] = expenses.slice(0, 4).map((e) => ({
    id: e.id,
    title: e.description ?? "Expense",
    phaseLabel: e.phase_id ? (phaseTitleById.get(e.phase_id) ?? "") : "",
    date: new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    amount: Number(e.amount),
  }));

  return {
    org: { id: org.id, name: org.name, slug: org.slug, logoUrl: org.logo_url },
    project: {
      id: project.id,
      slug: project.slug,
      title: project.title,
      description: project.description,
      status: project.status as ProjectStatus,
      isZakatEligible: project.is_zakat_eligible,
      coverImageUrl: project.cover_image_url,
    },
    raised: totalRaised,
    goal: totalGoal,
    spent: totalSpent,
    activePhaseLabel: activePhase?.name ?? "",
    activePhaseId: activePhase?.id ?? null,
    phases: publicPhases,
    expenses: publicExpenses,
    expensesTotal: expenses.length,
  };
});

export async function getPublicProjectSafe(
  orgSlug: string,
  projectSlug: string
): Promise<PublicProjectData | null> {
  try {
    return await getPublicProject(orgSlug, projectSlug);
  } catch {
    return null;
  }
}

export type LedgerEntry = { id: string; title: string; phaseLabel: string; date: string; amount: number };

export async function getProjectLedger(
  orgSlug: string,
  projectSlug: string
): Promise<{ org: { name: string }; project: { title: string }; entries: LedgerEntry[] }> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) notFound();

  const { data: project } = await supabase
    .from("projects")
    .select("id, title")
    .eq("slug", projectSlug)
    .eq("org_id", org.id)
    .maybeSingle();

  if (!project) notFound();

  const [{ data: phases }, { data: expenseRows }] = await Promise.all([
    supabase.from("phases").select("id, title").eq("project_id", project.id),
    supabase
      .from("expenses")
      .select("id, description, amount, phase_id, created_at")
      .eq("project_id", project.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
  ]);

  const phaseTitleById = new Map((phases ?? []).map((p) => [p.id, p.title]));

  return {
    org: { name: org.name },
    project: { title: project.title },
    entries: (expenseRows ?? []).map((e) => ({
      id: e.id,
      title: e.description ?? "Expense",
      phaseLabel: e.phase_id ? (phaseTitleById.get(e.phase_id) ?? "") : "",
      date: new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      amount: Number(e.amount),
    })),
  };
}
