"use client";

import type { ReactNode } from "react";

interface MetricSelectorProps {
  label: string;
  icon: ReactNode;
  color: string;
  value: number | null;
  onChange: (value: number) => void;
  readOnly?: boolean;
}

export default function MetricSelector({
  label,
  icon,
  color,
  value,
  onChange,
  readOnly = false,
}: MetricSelectorProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label
        className="font-[family-name:var(--font-pixel)] text-[10px] flex items-center gap-1.5 min-w-0"
        style={{ color }}
      >
        {icon} {label}
      </label>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = value !== null && n <= value;
          return (
            <button
              key={n}
              type="button"
              disabled={readOnly}
              aria-label={`${label}: ${n} of 5`}
              className="metric-dot w-7 h-7 rounded-full flex items-center justify-center font-[family-name:var(--font-pixel)] text-[9px] cursor-pointer disabled:cursor-default"
              style={{
                "--dot-color": color,
                background: filled ? color : "transparent",
                border: `1px solid ${filled ? color : `color-mix(in srgb, ${color} 30%, transparent)`}`,
                color: filled ? "var(--bg-dark)" : `color-mix(in srgb, ${color} 50%, transparent)`,
              } as React.CSSProperties}
              onClick={() => !readOnly && onChange(n)}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
