"use client";

import { useEffect, useState } from "react";

type ProgressBarProps = {
  raised: number;
  target: number;
  label: string;
};

export function ProgressBar({ raised, target, label }: ProgressBarProps) {
  const rawPercent = target > 0 ? Math.round((raised / target) * 100) : 0;
  const percent = Math.min(100, rawPercent);
  const overGoal = rawPercent > 100;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setWidth(percent));
    return () => cancelAnimationFrame(frame);
  }, [percent]);

  return (
    <div
      role="progressbar"
      aria-valuenow={rawPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={label}
      className="h-2.5 w-full overflow-hidden rounded-pill bg-track"
    >
      {width > 0 && (
        <div
          className={`h-full rounded-pill bg-gradient-to-r transition-[width] duration-500 ease-out ${
            overGoal ? "from-accent to-success" : "from-accent to-accent-bright"
          }`}
          style={{ width: `${width}%` }}
        />
      )}
    </div>
  );
}
