"use client";

import { useState } from "react";
import { saveRecurringAvailability, type DayAvailabilityInput } from "@/lib/actions/officiant";
import type { RecurringWindow } from "@/lib/data/services";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIME_OPTIONS = Array.from({ length: 33 }, (_, i) => {
  const minutes = 6 * 60 + i * 30;
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

function defaultDays(recurring: RecurringWindow[]): DayAvailabilityInput[] {
  return DAY_LABELS.map((_, dayOfWeek) => {
    const existing = recurring.find((row) => row.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek,
      enabled: Boolean(existing),
      startTime: existing?.startTime ?? "09:00",
      endTime: existing?.endTime ?? "12:00",
    };
  });
}

export function AvailabilityGrid({ recurring }: { recurring: RecurringWindow[] }) {
  const [days, setDays] = useState<DayAvailabilityInput[]>(() => defaultDays(recurring));
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateDay(dayOfWeek: number, patch: Partial<DayAvailabilityInput>) {
    setDays((current) =>
      current.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day))
    );
  }

  async function handleSave() {
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await saveRecurringAvailability(days);
      setMessage("Weekly hours saved. Open slots were generated four weeks out.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save availability.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12.5px] text-body">
        Check the days you can officiate and set a time range. Times are stored as UTC.
      </p>
      <div className="flex flex-col gap-2">
        {days.map((day) => (
          <label
            key={day.dayOfWeek}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-hairline bg-white px-3 py-2.5"
          >
            <input
              type="checkbox"
              checked={day.enabled}
              onChange={(e) => updateDay(day.dayOfWeek, { enabled: e.target.checked })}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            <span className="w-[92px] text-[13.5px] font-medium text-ink">{DAY_LABELS[day.dayOfWeek]}</span>
            <select
              value={day.startTime}
              disabled={!day.enabled}
              onChange={(e) => updateDay(day.dayOfWeek, { startTime: e.target.value })}
              className="rounded-md border border-border bg-white px-2 py-1.5 text-[13px] text-ink disabled:opacity-40"
            >
              {TIME_OPTIONS.map((time) => (
                <option key={`${day.dayOfWeek}-start-${time}`} value={time}>
                  {time}
                </option>
              ))}
            </select>
            <span className="text-[12px] text-muted">to</span>
            <select
              value={day.endTime}
              disabled={!day.enabled}
              onChange={(e) => updateDay(day.dayOfWeek, { endTime: e.target.value })}
              className="rounded-md border border-border bg-white px-2 py-1.5 text-[13px] text-ink disabled:opacity-40"
            >
              {TIME_OPTIONS.map((time) => (
                <option key={`${day.dayOfWeek}-end-${time}`} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {message && <p className="text-[12.5px] text-accent">{message}</p>}
      {error && <p className="text-[12.5px] text-danger">{error}</p>}
      <button
        type="button"
        disabled={submitting}
        onClick={handleSave}
        className="rounded-lg bg-accent py-3 text-[15px] font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Save weekly hours"}
      </button>
    </div>
  );
}
