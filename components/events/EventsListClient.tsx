"use client";

import { useMemo, useState } from "react";
import type { OrgEvent } from "@/lib/data/events";
import { createEvent, deleteEvent, updateEvent } from "@/lib/actions/event";
import type { RecurrenceFrequency, SeriesScope } from "@/lib/events/recurrence";

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateInput(isoOrDate: string) {
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type FormMode =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; event: OrgEvent };

function dateKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function eventDateKey(event: OrgEvent) {
  return dateKey(new Date(event.startsAt));
}

export function EventsListClient({
  events,
  canManage,
}: {
  events: OrgEvent[];
  canManage: boolean;
}) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [formMode, setFormMode] = useState<FormMode>({ kind: "closed" });

  const grouped = useMemo(() => {
    const groups = new Map<string, OrgEvent[]>();
    for (const event of events) {
      const list = groups.get(event.day) ?? [];
      list.push(event);
      groups.set(event.day, list);
    }
    return Array.from(groups.entries());
  }, [events]);

  const formOpen = formMode.kind !== "closed";

  return (
    <div
      className={`mx-auto flex min-h-screen w-full max-w-[390px] flex-col bg-surface ${
        formOpen ? "pb-6" : "pb-4"
      }`}
    >
      <header className="flex items-center border-b border-hairline px-[18px] pb-3 pt-4">
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
            onClick={() => setView("calendar")}
            className={`rounded-pill px-[11px] py-[7px] text-[12.5px] font-semibold ${
              view === "calendar" ? "bg-accent-wash text-ink" : "text-body"
            }`}
          >
            Calendar
          </button>
        </div>
      </header>

      {formMode.kind === "create" ? (
        <EventForm
          key="create"
          mode="create"
          submitLabel="Create event"
          submittingLabel="Creating…"
          onCancel={() => setFormMode({ kind: "closed" })}
          onSubmit={async (values) => {
            await createEvent({
              title: values.title,
              description: values.description,
              location: values.location,
              startsAt: values.startsAt,
              endsAt: values.endsAt,
              price: values.price,
              recurrence: values.recurrence,
              recurrenceUntil: values.recurrenceUntil,
            });
            setFormMode({ kind: "closed" });
          }}
        />
      ) : formMode.kind === "edit" ? (
        <EventForm
          key={formMode.event.id}
          mode="edit"
          initial={formMode.event}
          submitLabel="Save changes"
          submittingLabel="Saving…"
          onCancel={() => setFormMode({ kind: "closed" })}
          onSubmit={async (values) => {
            await updateEvent({
              id: formMode.event.id,
              title: values.title,
              description: values.description,
              location: values.location,
              startsAt: values.startsAt,
              endsAt: values.endsAt,
              price: values.price,
              scope: values.scope,
            });
            setFormMode({ kind: "closed" });
          }}
          onDelete={async (scope) => {
            await deleteEvent(formMode.event.id, scope);
            setFormMode({ kind: "closed" });
          }}
        />
      ) : view === "calendar" ? (
        <CalendarView
          events={events}
          canManage={canManage}
          onEditEvent={(event) => setFormMode({ kind: "edit", event })}
        />
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
                <EventRow
                  key={event.id}
                  event={event}
                  canManage={canManage}
                  onEdit={() => setFormMode({ kind: "edit", event })}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {canManage && !formOpen && (
        <footer className="sticky bottom-16 z-10 mt-auto w-full border-t border-hairline bg-surface/95 px-[18px] py-3.5 backdrop-blur-sm min-[900px]:bottom-0">
          <button
            type="button"
            onClick={() => setFormMode({ kind: "create" })}
            className="mx-auto block w-full rounded-lg bg-accent py-3.5 text-center text-[15px] font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Add event
          </button>
        </footer>
      )}
    </div>
  );
}

function EventRow({
  event,
  canManage,
  onEdit,
}: {
  event: OrgEvent;
  canManage: boolean;
  onEdit: () => void;
}) {
  const row = (
    <>
      <span className="w-[3px] shrink-0 rounded-2xs bg-accent" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <span className="text-[15px] font-semibold text-ink">{event.title}</span>
          <span className="shrink-0 font-mono text-[11.5px] font-medium text-body">
            {event.priceLabel}
          </span>
        </div>
        <span className="font-mono text-[11.5px] text-body">{event.timePlace}</span>
        {event.description && (
          <p className="text-[13px] leading-snug text-body">{event.description}</p>
        )}
        {event.recurrenceLabel && (
          <span className="text-[11.5px] text-muted">{event.recurrenceLabel}</span>
        )}
      </div>
    </>
  );

  if (canManage) {
    return (
      <button
        type="button"
        onClick={onEdit}
        className="flex w-full gap-3 border-t border-hairline-soft px-[18px] py-3 text-left"
      >
        {row}
      </button>
    );
  }

  return <div className="flex gap-3 border-t border-hairline-soft px-[18px] py-3">{row}</div>;
}

type EventFormValues = {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  price: number;
  recurrence: RecurrenceFrequency | null;
  recurrenceUntil: string | null;
  scope: SeriesScope;
};

function EventForm({
  mode,
  initial,
  submitLabel,
  submittingLabel,
  onCancel,
  onSubmit,
  onDelete,
}: {
  mode: "create" | "edit";
  initial?: OrgEvent;
  submitLabel: string;
  submittingLabel: string;
  onCancel: () => void;
  onSubmit: (values: EventFormValues) => Promise<void>;
  onDelete?: (scope: SeriesScope) => Promise<void>;
}) {
  const isRecurring = Boolean(initial?.isRecurring);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [startsAt, setStartsAt] = useState(initial?.startsAt ? toDatetimeLocal(initial.startsAt) : "");
  const [endsAt, setEndsAt] = useState(initial?.endsAt ? toDatetimeLocal(initial.endsAt) : "");
  const [isFree, setIsFree] = useState(initial ? initial.isFree : true);
  const [priceText, setPriceText] = useState(
    initial && !initial.isFree ? String(initial.price) : ""
  );
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency | "none">("none");
  const [recurrenceUntil, setRecurrenceUntil] = useState("");
  const [scope, setScope] = useState<SeriesScope>("this");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = isFree ? 0 : Number(priceText);
  const rangeValid =
    startsAt.length > 0 &&
    endsAt.length > 0 &&
    new Date(endsAt).getTime() > new Date(startsAt).getTime();
  const priceValid = isFree || (Number.isFinite(price) && price > 0);
  const recurrenceValid =
    mode === "edit" ||
    recurrence === "none" ||
    (recurrenceUntil.length > 0 && new Date(recurrenceUntil).getTime() >= new Date(startsAt).getTime());
  const canSubmit =
    title.trim().length > 0 && rangeValid && priceValid && recurrenceValid && !submitting && !deleting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        price: isFree ? 0 : price,
        recurrence: mode === "create" && recurrence !== "none" ? recurrence : null,
        recurrenceUntil:
          mode === "create" && recurrence !== "none" ? recurrenceUntil : null,
        scope,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!onDelete || deleting || submitting) return;
    const label =
      !isRecurring || scope === "this"
        ? "Delete this event? This cannot be undone."
        : scope === "following"
          ? "Delete this and all following events in the series? This cannot be undone."
          : "Delete every event in this series? This cannot be undone.";
    if (!window.confirm(label)) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete(isRecurring ? scope : "this");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setDeleting(false);
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
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        className="resize-none rounded-lg border border-border bg-white px-3.5 py-3 text-[15px] text-ink"
      />
      <input
        type="text"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="rounded-lg border border-border bg-white px-3.5 py-3 text-[15px] text-ink"
      />
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">Starts</span>
        <input
          type="datetime-local"
          required
          value={startsAt}
          onChange={(e) => {
            const nextStart = e.target.value;
            setStartsAt(nextStart);
            if (nextStart && (!endsAt || new Date(endsAt).getTime() <= new Date(nextStart).getTime())) {
              const next = new Date(nextStart);
              next.setHours(next.getHours() + 1);
              setEndsAt(toDatetimeLocal(next.toISOString()));
            }
          }}
          className="rounded-lg border border-border bg-white px-3.5 py-3 text-[15px] text-ink"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">Ends</span>
        <input
          type="datetime-local"
          required
          value={endsAt}
          min={startsAt || undefined}
          onChange={(e) => setEndsAt(e.target.value)}
          className="rounded-lg border border-border bg-white px-3.5 py-3 text-[15px] text-ink"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">Price</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsFree(true)}
            className={`flex-1 rounded-lg py-3 text-[14px] font-semibold ${
              isFree ? "bg-accent-wash text-accent" : "border border-border bg-white text-body"
            }`}
          >
            Free
          </button>
          <button
            type="button"
            onClick={() => setIsFree(false)}
            className={`flex-1 rounded-lg py-3 text-[14px] font-semibold ${
              !isFree ? "bg-accent-wash text-accent" : "border border-border bg-white text-body"
            }`}
          >
            Paid
          </button>
        </div>
        {!isFree && (
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted">
              $
            </span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={priceText}
              onChange={(e) => setPriceText(e.target.value)}
              className="w-full rounded-lg border border-border bg-white py-3 pl-7 pr-3.5 text-[15px] text-ink"
            />
          </div>
        )}
      </div>

      {mode === "create" && (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
              Repeat
            </span>
            <select
              value={recurrence}
              onChange={(e) => {
                const value = e.target.value as RecurrenceFrequency | "none";
                setRecurrence(value);
                if (value !== "none" && !recurrenceUntil && startsAt) {
                  const until = new Date(startsAt);
                  until.setMonth(until.getMonth() + 2);
                  setRecurrenceUntil(toDateInput(until.toISOString()));
                }
              }}
              className="rounded-lg border border-border bg-white px-3.5 py-3 text-[15px] text-ink"
            >
              <option value="none">Does not repeat</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          {recurrence !== "none" && (
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
                Repeat until
              </span>
              <input
                type="date"
                value={recurrenceUntil}
                min={startsAt ? toDateInput(startsAt) : undefined}
                onChange={(e) => setRecurrenceUntil(e.target.value)}
                className="rounded-lg border border-border bg-white px-3.5 py-3 text-[15px] text-ink"
              />
              <span className="text-[11.5px] text-muted">Creates each occurrence up to this date.</span>
            </label>
          )}
        </div>
      )}

      {mode === "edit" && isRecurring && (
        <fieldset className="flex flex-col gap-2 rounded-lg border border-border bg-white p-3">
          <legend className="px-1 font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
            Apply changes to
          </legend>
          {(
            [
              ["this", "Only this event"],
              ["following", "This and following events"],
              ["all", "All events in the series"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2.5 text-[14px] text-ink">
              <input
                type="radio"
                name="series-scope"
                checked={scope === value}
                onChange={() => setScope(value)}
                className="accent-[var(--color-accent)]"
              />
              {label}
            </label>
          ))}
          {scope !== "this" && (
            <p className="text-[11.5px] leading-snug text-muted">
              Date stays per occurrence; the time of day and details update across the selected
              events.
            </p>
          )}
        </fieldset>
      )}

      {error && <p className="text-[12.5px] text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border bg-white py-3.5 text-[15px] font-semibold text-ink"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="flex-1 rounded-lg bg-accent py-3.5 text-[15px] font-semibold text-white disabled:opacity-50"
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
      {onDelete && (
        <button
          type="button"
          disabled={deleting || submitting}
          onClick={handleDelete}
          className="rounded-lg border border-danger/30 bg-white py-3.5 text-[15px] font-semibold text-danger disabled:opacity-50"
        >
          {deleting
            ? "Deleting…"
            : !isRecurring || scope === "this"
              ? "Delete event"
              : scope === "following"
                ? "Delete this & following"
                : "Delete entire series"}
        </button>
      )}
    </div>
  );
}

function CalendarView({
  events,
  canManage,
  onEditEvent,
}: {
  events: OrgEvent[];
  canManage: boolean;
  onEditEvent: (event: OrgEvent) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedKey, setSelectedKey] = useState(() => dateKey(today));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const eventsByDay = useMemo(() => {
    const map = new Map<string, OrgEvent[]>();
    for (const event of events) {
      const key = eventDateKey(event);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const selectedEvents = eventsByDay.get(selectedKey) ?? [];
  const selectedLabel = useMemo(() => {
    const [y, m, d] = selectedKey.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedKey]);

  const todayKey = dateKey(today);
  const leadingBlanks = Array.from({ length: firstWeekday }, (): number | null => null);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const cells: (number | null)[] = [...leadingBlanks, ...monthDays];

  function shiftMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    const dayNum = Math.min(
      Number(selectedKey.split("-")[2]),
      new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
    );
    setCursor(next);
    setSelectedKey(dateKey(new Date(next.getFullYear(), next.getMonth(), dayNum)));
  }

  function selectDay(day: number) {
    setSelectedKey(dateKey(new Date(year, month, day)));
  }

  return (
    <div className="flex flex-col">
      <div className="px-[18px] pb-2 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[18px] text-body transition-colors hover:bg-neutral-wash hover:text-ink"
          >
            ‹
          </button>
          <div className="text-[16px] font-semibold tracking-[-0.02em] text-ink">{monthLabel}</div>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[18px] text-body transition-colors hover:bg-neutral-wash hover:text-ink"
          >
            ›
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 text-center font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <span key={i} className="py-1">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="h-12" />;

            const key = dateKey(new Date(year, month, day));
            const dayEvents = eventsByDay.get(key) ?? [];
            const eventCount = dayEvents.length;
            const hasEvents = eventCount > 0;
            const isSelected = key === selectedKey;
            const isToday = key === todayKey;
            const marks = Math.min(eventCount, 3);

            return (
              <button
                key={i}
                type="button"
                onClick={() => selectDay(day)}
                aria-label={
                  hasEvents
                    ? `${day}, ${eventCount} event${eventCount === 1 ? "" : "s"}`
                    : String(day)
                }
                className="flex h-12 flex-col items-center justify-start pt-0.5"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] transition-colors ${
                    isSelected
                      ? "bg-accent font-semibold text-white"
                      : hasEvents
                        ? "bg-accent-wash font-semibold text-accent"
                        : isToday
                          ? "font-semibold text-accent ring-1 ring-inset ring-accent/50"
                          : "text-ink hover:bg-neutral-wash"
                  }`}
                >
                  {day}
                </span>
                <span className="mt-0.5 flex h-1.5 items-center justify-center gap-0.5">
                  {Array.from({ length: marks }, (_, markIndex) => (
                    <span key={markIndex} className="h-1 w-1 rounded-full bg-accent" />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-hairline-soft px-[18px] pb-2 pt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
        {selectedLabel}
      </div>
      {selectedEvents.length === 0 ? (
        <p className="px-[18px] py-4 text-sm text-body">No events this day.</p>
      ) : (
        selectedEvents.map((event) => (
          <EventRow
            key={event.id}
            event={event}
            canManage={canManage}
            onEdit={() => onEditEvent(event)}
          />
        ))
      )}
    </div>
  );
}
