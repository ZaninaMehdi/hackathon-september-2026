"use client";

import { useMemo, useState } from "react";
import { CATEGORY_LABEL, FILTER_CHIPS, type EventCategory } from "@/lib/mock/events";
import type { OrgEvent } from "@/lib/data/events";
import { createEvent } from "@/lib/actions/event";

const CATEGORY_TO_FILTER: Record<EventCategory, (typeof FILTER_CHIPS)[number]> = {
  construction: "Construction",
  fundraising: "Fundraising",
  community: "Community",
  life_event: "Life events",
};

const CATEGORY_OPTIONS: EventCategory[] = ["community", "fundraising", "life_event", "construction"];

function railColor(category: EventCategory, pending?: boolean) {
  if (pending) return "bg-pending-border";
  if (category === "construction" || category === "fundraising") return "bg-accent";
  return "bg-border-strong";
}

function chipClasses(category: EventCategory) {
  if (category === "construction" || category === "fundraising") {
    return "bg-accent-wash text-accent";
  }
  return "bg-neutral-wash text-body";
}

export function EventsListClient({
  events,
  canManage,
}: {
  events: OrgEvent[];
  canManage: boolean;
}) {
  const [view, setView] = useState<"list" | "month">("list");
  const [activeFilters, setActiveFilters] = useState<Set<(typeof FILTER_CHIPS)[number]>>(
    new Set(["All"])
  );
  const [showAddForm, setShowAddForm] = useState(false);

  function toggleFilter(chip: (typeof FILTER_CHIPS)[number]) {
    setActiveFilters((prev) => {
      if (chip === "All") return new Set(["All"]);
      const next = new Set(prev);
      next.delete("All");
      if (next.has(chip)) {
        next.delete(chip);
      } else {
        next.add(chip);
      }
      return next.size === 0 ? new Set(["All"]) : next;
    });
  }

  const filteredEvents = useMemo(() => {
    if (activeFilters.has("All")) return events;
    return events.filter((event) => activeFilters.has(CATEGORY_TO_FILTER[event.category]));
  }, [activeFilters, events]);

  const grouped = useMemo(() => {
    const groups = new Map<string, OrgEvent[]>();
    for (const event of filteredEvents) {
      const list = groups.get(event.day) ?? [];
      list.push(event);
      groups.set(event.day, list);
    }
    return Array.from(groups.entries());
  }, [filteredEvents]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col bg-surface pb-[100px]">
      <header className="flex flex-col gap-3 border-b border-hairline px-[18px] pb-3 pt-4">
        <div className="flex items-center">
          <h1 className="text-[19px] font-bold tracking-[-0.025em] text-ink">Events</h1>
          <div className="ml-auto flex gap-1">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`rounded-pill px-[11px] py-[7px] text-[12.5px] font-semibold ${
                view === "list" ? "bg-accent-wash text-ink" : "text-body"
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setView("month")}
              className={`rounded-pill px-[11px] py-[7px] text-[12.5px] font-semibold ${
                view === "month" ? "bg-accent-wash text-ink" : "text-body"
              }`}
            >
              Month
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTER_CHIPS.map((chip) => {
            const active = activeFilters.has(chip);
            return (
              <button
                key={chip}
                type="button"
                onClick={() => toggleFilter(chip)}
                className={`rounded-pill px-3 py-[7px] text-xs ${
                  active ? "bg-ink font-semibold text-white" : "border border-border bg-white text-body"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </header>

      {showAddForm ? (
        <AddEventForm onDone={() => setShowAddForm(false)} />
      ) : view === "month" ? (
        <MonthGrid events={events} />
      ) : (
        <div className="flex flex-col">
          {grouped.length === 0 && (
            <p className="px-[18px] py-6 text-sm text-body">No events yet.</p>
          )}
          {grouped.map(([day, dayEvents]) => (
            <div key={day}>
              <div className="border-t border-hairline-soft px-[18px] pb-2 pt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                {day}
              </div>
              {dayEvents.map((event) => (
                <div key={event.id} className="flex gap-3 border-t border-hairline-soft px-[18px] py-3">
                  <span
                    className={`w-[3px] shrink-0 rounded-2xs ${railColor(event.category, event.pending)}`}
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-[15px] font-semibold text-ink">{event.title}</span>
                    <span className="font-mono text-[11.5px] text-body">{event.timePlace}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {event.pending ? (
                        <span className="inline-flex items-center rounded-pill border border-dashed border-pending-border bg-white px-2 py-[3px] font-mono text-[10px] font-medium uppercase tracking-[0.04em] text-pending-text">
                          Pending
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center rounded-pill px-2 py-[3px] text-[11px] font-semibold ${chipClasses(event.category)}`}
                        >
                          {CATEGORY_LABEL[event.category]}
                        </span>
                      )}
                      {event.qualifier && (
                        <span className="text-[11.5px] text-muted">{event.qualifier}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <footer className="fixed bottom-0 left-1/2 flex w-full max-w-[390px] -translate-x-1/2 gap-2 border-t border-hairline bg-surface px-[18px] pb-[18px] pt-3.5">
        <button
          type="button"
          className="flex-1 rounded-lg bg-accent py-4 text-[15px] font-semibold text-white"
        >
          Request a booking
        </button>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="rounded-lg border border-border bg-white px-4 py-4 text-[15px] font-semibold text-ink"
          >
            {showAddForm ? "Close" : "Add"}
          </button>
        )}
      </footer>
    </div>
  );
}

function AddEventForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [category, setCategory] = useState<EventCategory>("community");
  const [qualifier, setQualifier] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await createEvent({
        title: title.trim(),
        location: location.trim(),
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        category,
        qualifier: qualifier.trim(),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 px-[18px] py-4">
      <input
        type="text"
        placeholder="Event title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded-lg border border-border bg-white px-3.5 py-3 text-[15px] text-ink"
      />
      <input
        type="text"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="rounded-lg border border-border bg-white px-3.5 py-3 text-[15px] text-ink"
      />
      <input
        type="datetime-local"
        value={startsAt}
        onChange={(e) => setStartsAt(e.target.value)}
        className="rounded-lg border border-border bg-white px-3.5 py-3 text-[15px] text-ink"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as EventCategory)}
        className="rounded-lg border border-border bg-white px-3.5 py-3 text-[15px] text-ink"
      >
        {CATEGORY_OPTIONS.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABEL[c]}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Qualifier (e.g. Open to all · 42 going)"
        value={qualifier}
        onChange={(e) => setQualifier(e.target.value)}
        className="rounded-lg border border-border bg-white px-3.5 py-3 text-[15px] text-ink"
      />
      {error && <p className="text-[12.5px] text-danger">{error}</p>}
      <button
        type="button"
        disabled={submitting || title.trim().length === 0}
        onClick={handleSubmit}
        className="rounded-lg bg-accent py-3.5 text-[15px] font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create event"}
      </button>
    </div>
  );
}

function MonthGrid({ events }: { events: OrgEvent[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventDays = new Set(
    events
      .map((e) => {
        const match = e.day.match(/(\w+) (\d+)/);
        return match ? Number(match[2]) : null;
      })
      .filter((d): d is number => d !== null)
  );

  const leadingBlanks = Array.from({ length: firstWeekday }, (): number | null => null);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const cells: (number | null)[] = [...leadingBlanks, ...monthDays];

  return (
    <div className="px-[18px] py-4">
      <div className="mb-2 grid grid-cols-7 text-center font-mono text-[10px] uppercase text-muted">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-2 text-center">
        {cells.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            {day && (
              <>
                <span className="text-[13px] text-ink">{day}</span>
                {eventDays.has(day) && <span className="h-[3px] w-[3px] rounded-full bg-accent" />}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
