export type EventCategory = "construction" | "fundraising" | "community" | "life_event";

export type MockEvent = {
  id: string;
  day: string;
  title: string;
  timePlace: string;
  category: EventCategory;
  qualifier: string;
  pending?: boolean;
};

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  construction: "Construction",
  fundraising: "Fundraising",
  community: "Community",
  life_event: "Life event",
};

export const FILTER_CHIPS = ["All", "Community", "Fundraising", "Life events", "Construction"] as const;

export const mockEvents: MockEvent[] = [
  {
    id: "1",
    day: "Sat Sep 12",
    title: "Phase 2 walkthrough & Q&A",
    timePlace: "10:00 AM · Main hall",
    category: "construction",
    qualifier: "Open to all · 42 going",
  },
  {
    id: "2",
    day: "Sat Sep 12",
    title: "Nikah — Haddad & Aziz",
    timePlace: "4:00 PM · Annex",
    category: "life_event",
    qualifier: "Private · family only",
  },
  {
    id: "3",
    day: "Sun Sep 13",
    title: "Renovation fund dinner",
    timePlace: "6:30 PM · Courtyard",
    category: "fundraising",
    qualifier: "$40 · 118 tickets left",
  },
  {
    id: "4",
    day: "Sun Sep 13",
    title: "Janazah request — Siddiqui family",
    timePlace: "Time to be confirmed · Prayer hall",
    category: "community",
    qualifier: "Needs a hall confirmation",
    pending: true,
  },
  {
    id: "5",
    day: "Wed Sep 16",
    title: "Board meeting — expense review",
    timePlace: "7:00 PM · Office",
    category: "community",
    qualifier: "Board only · 7 items queued",
  },
];
