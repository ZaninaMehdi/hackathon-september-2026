"use client";

import { useMemo, useState } from "react";
import type { OpenSlot } from "@/lib/data/services";

type DayGroup = {
  dateKey: string;
  dateLabel: string;
  weekdayLabel: string;
  dayNumber: string;
  slots: OpenSlot[];
};

function groupSlotsByDay(slots: OpenSlot[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();
  for (const slot of slots) {
    const existing = groups.get(slot.dateKey);
    if (existing) {
      existing.slots.push(slot);
      continue;
    }
    groups.set(slot.dateKey, {
      dateKey: slot.dateKey,
      dateLabel: slot.dateLabel,
      weekdayLabel: slot.weekdayLabel,
      dayNumber: slot.dayNumber,
      slots: [slot],
    });
  }
  return Array.from(groups.values());
}

export function NikahSlotPicker({
  slots,
  selectedSlotId,
  onSelect,
}: {
  slots: OpenSlot[];
  selectedSlotId: string;
  onSelect: (slotId: string) => void;
}) {
  const days = useMemo(() => groupSlotsByDay(slots), [slots]);
  const [pickedDateKey, setPickedDateKey] = useState<string | null>(null);

  // Derived during render rather than synced through an effect: when the slot
  // list refreshes and the picked day is gone (fully booked, or out of range),
  // this falls back to the first open day instead of holding a stale key.
  const selectedDay = days.find((day) => day.dateKey === pickedDateKey) ?? days[0];

  if (days.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {days.map((day) => {
          const selected = day.dateKey === selectedDay?.dateKey;
          return (
            <button
              key={day.dateKey}
              type="button"
              onClick={() => {
                setPickedDateKey(day.dateKey);
                onSelect("");
              }}
              className={`flex min-w-[58px] flex-col items-center rounded-lg px-2.5 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                selected ? "bg-accent text-white" : "border border-border bg-white text-ink"
              }`}
            >
              <span className={`text-micro uppercase ${selected ? "text-white/80" : "text-muted"}`}>
                {day.weekdayLabel}
              </span>
              <span className="text-subhead font-semibold leading-tight">{day.dayNumber}</span>
              <span className={`font-mono text-micro ${selected ? "text-white/80" : "text-muted"}`}>
                {day.slots.length} open
              </span>
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="flex flex-col gap-2">
          <p className="text-meta text-body">{selectedDay.dateLabel}</p>
          <div className="flex flex-wrap gap-2">
            {selectedDay.slots.map((slot) => {
              const selected = selectedSlotId === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => onSelect(slot.id)}
                  className={`rounded-pill px-3.5 py-2 font-mono text-meta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    selected
                      ? "bg-accent font-semibold text-white"
                      : "border border-border bg-white text-ink"
                  }`}
                >
                  {slot.timeLabel}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
