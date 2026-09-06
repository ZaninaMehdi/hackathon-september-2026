"use client";

import { useEffect, useState } from "react";

type ProgressBarProps = {
  raised: number;
  target: number;
  label: string;
};

export function ProgressBar({ raised, target, label }: ProgressBarProps) {
  const percent = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setWidth(percent));
    return () => cancelAnimationFrame(frame);
  }, [percent]);

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={label}
      className="h-2 w-full overflow-hidden rounded-pill bg-track"
    >
      {width > 0 && (
        <div
          className="h-full rounded-pill bg-accent transition-[width] duration-[400ms] ease-out"
          style={{ width: `${width}%` }}
        />
      )}
    </div>
  );
}
