"use client";

import type { WeeklyCard } from "@/lib/types";

interface CardDisplayProps {
  card: WeeklyCard;
  type: "monday" | "friday";
  onClick: (e: React.MouseEvent) => void;
}

export default function CardDisplay({ card, type, onClick }: CardDisplayProps) {
  const color = card.member?.color || "var(--text-muted)";
  const name = card.member?.name || "Unknown";
  const initial = name[0];

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold cursor-pointer card-badge-hover"
      style={{
        background: `${color}15`,
        border: `1px solid ${color}30`,
        color: color,
      }}
      title={`${name}'s ${type === "monday" ? "Monday" : "Friday"} card`}
    >
      <span>{initial}</span>
    </button>
  );
}
