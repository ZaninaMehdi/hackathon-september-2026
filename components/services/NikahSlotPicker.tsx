"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [dateKey, setDateKey] = useState(days[0]?.dateKey ?? "");

  useEffect(() => {
    if (days.length === 0) {
      setDateKey("");
      return;
    }
    if (!days.some((day) => day.dateKey === dateKey)) {
      setDateKey(days[0].dateKey);
    }
  }, [dateKey, days]);

  const selectedDay = days.find((day) => day.dateKey === dateKey) ?? days[0];

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
                setDateKey(day.dateKey);
                onSelect("");
              }}
              className={`flex min-w-[58px] flex-col items-center rounded-lg px-2.5 py-2 ${
                selected ? "bg-accent text-white" : "border border-border bg-white text-ink"
              }`}
            >
              <span className={`text-[10px] uppercase ${selected ? "text-white/80" : "text-muted"}`}>
                {day.weekdayLabel}
              </span>
              <span className="text-[16px] font-semibold leading-tight">{day.dayNumber}</span>
              <span className={`font-mono text-[9px] ${selected ? "text-white/80" : "text-muted"}`}>
                {day.slots.length} open
              </span>
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="flex flex-col gap-2">
          <p className="text-[12.5px] text-body">{selectedDay.dateLabel}</p>
          <div className="flex flex-wrap gap-2">
            {selectedDay.slots.map((slot) => {
              const selected = selectedSlotId === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => onSelect(slot.id)}
                  className={`rounded-pill px-3.5 py-2 font-mono text-[13px] ${
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
