export type RecurrenceFrequency = "weekly" | "biweekly" | "monthly";

export type SeriesScope = "this" | "following" | "all";

const MAX_OCCURRENCES = 52;

export function addRecurrenceStep(date: Date, frequency: RecurrenceFrequency): Date {
  const next = new Date(date);
  if (frequency === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (frequency === "biweekly") {
    next.setDate(next.getDate() + 14);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

export function generateOccurrenceStarts(
  firstStartsAt: Date,
  frequency: RecurrenceFrequency,
  untilInclusive: Date
): Date[] {
  const starts: Date[] = [];
  let cursor = new Date(firstStartsAt);
  const until = new Date(untilInclusive);
  until.setHours(23, 59, 59, 999);

  while (cursor.getTime() <= until.getTime() && starts.length < MAX_OCCURRENCES) {
    starts.push(new Date(cursor));
    cursor = addRecurrenceStep(cursor, frequency);
  }

  return starts;
}

export function applyTimeOfDay(base: Date, timeSource: Date): Date {
  const next = new Date(base);
  next.setHours(
    timeSource.getHours(),
    timeSource.getMinutes(),
    timeSource.getSeconds(),
    timeSource.getMilliseconds()
  );
  return next;
}

export function recurrenceLabel(frequency: RecurrenceFrequency | null | undefined): string | null {
  if (!frequency) return null;
  if (frequency === "weekly") return "Repeats weekly";
  if (frequency === "biweekly") return "Repeats every 2 weeks";
  return "Repeats monthly";
}
