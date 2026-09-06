export type PhaseStatus = "complete" | "in_progress" | "not_started" | "pending_approval";

export type Phase = {
  index: number;
  name: string;
  raised: number;
  target: number;
  status: PhaseStatus;
  caption: string;
};

export type ApprovedExpense = {
  id: string;
  title: string;
  vendor: string;
  phaseLabel: string;
  date: string;
  amount: number;
};

export type MockProject = {
  org: { name: string; location: string };
  title: string;
  reassurance: string;
  raised: number;
  goal: number;
  spent: number;
  activePhaseLabel: string;
  phases: Phase[];
  approvedExpenses: ApprovedExpense[];
  approvedExpensesTotal: number;
};

export const mockProject: MockProject = {
  org: { name: "Masjid Al-Noor", location: "Cedar Park, TX" },
  title: "Community Hall Renovation",
  reassurance:
    "Four phases. Every approved expense is posted here with its receipt within 48 hours.",
  raised: 412800,
  goal: 640000,
  spent: 291140,
  activePhaseLabel: "Phase 2",
  phases: [
    {
      index: 1,
      name: "Foundation & slab",
      raised: 148000,
      target: 148000,
      status: "complete",
      caption: "closed Mar 2026",
    },
    {
      index: 2,
      name: "Roof & envelope",
      raised: 143140,
      target: 224000,
      status: "in_progress",
      caption: "in progress",
    },
    {
      index: 3,
      name: "Interior & HVAC",
      raised: 0,
      target: 178000,
      status: "not_started",
      caption: "not started",
    },
    {
      index: 4,
      name: "Grounds & parking",
      raised: 0,
      target: 90000,
      status: "not_started",
      caption: "not started",
    },
  ],
  approvedExpensesTotal: 68,
  approvedExpenses: [
    {
      id: "1",
      title: "Standing-seam roof panels",
      vendor: "Hill Country Metals",
      phaseLabel: "Phase 2",
      date: "Aug 22",
      amount: 38400,
    },
    {
      id: "2",
      title: "Structural engineer review",
      vendor: "Cedar Park Engineering",
      phaseLabel: "Phase 2",
      date: "Aug 14",
      amount: 6200,
    },
    {
      id: "3",
      title: "Scaffold rental",
      vendor: "Lonestar Waste & Rentals",
      phaseLabel: "Phase 2",
      date: "Aug 9",
      amount: 3780,
    },
    {
      id: "4",
      title: "Permit fees, city",
      vendor: "City of Cedar Park",
      phaseLabel: "Phase 2",
      date: "Jul 30",
      amount: 1940,
    },
  ],
};

export function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
