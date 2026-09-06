export type MockEvent = {
  id: string;
  day: string;
  title: string;
  description?: string;
  timePlace: string;
};

export const mockEvents: MockEvent[] = [
  {
    id: "1",
    day: "Sat Sep 12",
    title: "Phase 2 walkthrough & Q&A",
    description: "Tour the construction progress and ask the team questions.",
    timePlace: "10:00 AM – 11:30 AM · Main hall",
  },
  {
    id: "2",
    day: "Sat Sep 12",
    title: "Nikah — Haddad & Aziz",
    description: "Private ceremony for family and invited guests.",
    timePlace: "4:00 PM – 6:00 PM · Annex",
  },
  {
    id: "3",
    day: "Sun Sep 13",
    title: "Renovation fund dinner",
    description: "Community dinner supporting the renovation fund.",
    timePlace: "6:30 PM – 9:00 PM · Courtyard",
  },
  {
    id: "4",
    day: "Sun Sep 13",
    title: "Janazah — Siddiqui family",
    description: "Funeral prayer for the Siddiqui family.",
    timePlace: "11:00 AM – 12:00 PM · Prayer hall",
  },
  {
    id: "5",
    day: "Wed Sep 16",
    title: "Board meeting — expense review",
    description: "Monthly board review of queued expenses.",
    timePlace: "7:00 PM – 8:30 PM · Office",
  },
];
