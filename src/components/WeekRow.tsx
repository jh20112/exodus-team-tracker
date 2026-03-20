"use client";

import type { TeamMember, WeeklyCard } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import CardDisplay from "./CardDisplay";

interface WeekRowProps {
  weekStart: Date;
  cards: WeeklyCard[];
  currentMember: TeamMember;
  expanded: boolean;
  onToggle: () => void;
  onOpenForm: (
    weekStart: string,
    type: "monday" | "friday",
    member?: TeamMember,
    card?: WeeklyCard
  ) => void;
}

export default function WeekRow({
  weekStart,
  cards,
  currentMember,
  expanded,
  onToggle,
  onOpenForm,
}: WeekRowProps) {
  const wsStr = formatDate(weekStart);
  const weekCards = cards.filter(
    (c) => formatDate(new Date(c.weekStart)) === wsStr
  );
  const mondayCards = weekCards.filter((c) => c.mondayCompleted);
  const fridayCards = weekCards.filter((c) => c.fridayCompleted);
  const hasMondayCard = mondayCards.some(
    (c) => c.memberId === currentMember.id
  );
  const hasFridayCard = fridayCards.some(
    (c) => c.memberId === currentMember.id
  );

  const weekLabel = weekStart.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }).toUpperCase();

  // Total members who have any card for this week
  const totalMembers = new Set(weekCards.map((c) => c.memberId)).size || 4;

  if (!expanded) {
    return (
      <button
        onClick={onToggle}
        className="w-full week-row day-cell-hover"
      >
        <div className="flex items-center gap-3 sm:gap-4 px-3 py-2.5">
          {/* Week label */}
          <span
            className="font-[family-name:var(--font-pixel)] text-[8px] sm:text-[9px] shrink-0 w-24 text-left"
            style={{ color: "var(--text-muted)" }}
          >
            WEEK OF {weekLabel}
          </span>

          {/* Monday badges */}
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              {mondayCards.map((card) => (
                <CardDisplay
                  key={card.id}
                  card={card}
                  type="monday"
                  onClick={() =>
                    onOpenForm(wsStr, "monday", card.member as TeamMember, card)
                  }
                />
              ))}
            </div>
            <span
              className="font-[family-name:var(--font-pixel)] text-[7px]"
              style={{
                color:
                  mondayCards.length >= totalMembers
                    ? "var(--accent-green)"
                    : "var(--text-muted)",
              }}
            >
              {mondayCards.length >= totalMembers ? "✓" : "◐"}
            </span>
          </div>

          {/* Friday badges */}
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              {fridayCards.map((card) => (
                <CardDisplay
                  key={card.id}
                  card={card}
                  type="friday"
                  onClick={() =>
                    onOpenForm(wsStr, "friday", card.member as TeamMember, card)
                  }
                />
              ))}
            </div>
            <span
              className="font-[family-name:var(--font-pixel)] text-[7px]"
              style={{
                color:
                  fridayCards.length >= totalMembers
                    ? "var(--accent-rose)"
                    : "var(--text-muted)",
              }}
            >
              {fridayCards.length >= totalMembers ? "✓" : "◐"}
            </span>
          </div>

          {/* Spacer + chevron */}
          <span
            className="ml-auto font-[family-name:var(--font-pixel)] text-[10px] transition-transform"
            style={{ color: "var(--text-muted)" }}
          >
            ▸
          </span>
        </div>
      </button>
    );
  }

  // Expanded view
  return (
    <div className="week-row shadow-card" style={{ borderColor: "var(--border-default)" }}>
      {/* Collapsible header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-2.5 day-cell-hover"
      >
        <span
          className="font-[family-name:var(--font-pixel)] text-[8px] sm:text-[9px]"
          style={{ color: "var(--text-muted)" }}
        >
          WEEK OF {weekLabel}
        </span>
        <span
          className="ml-auto font-[family-name:var(--font-pixel)] text-[10px]"
          style={{ color: "var(--text-muted)" }}
        >
          ▾
        </span>
      </button>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 pt-0">
        {/* Monday column */}
        <button
          onClick={() => {
            const myCard = mondayCards.find((c) => c.memberId === currentMember.id);
            onOpenForm(wsStr, "monday", myCard ? currentMember : undefined, myCard || undefined);
          }}
          className="p-3 day-cell-hover text-left cursor-pointer"
          style={{
            background: "var(--bg-card)",
            borderTop: "2px solid var(--accent-green)",
            borderLeft: "none",
            borderRight: "none",
            borderBottom: "none",
          }}
        >
          <div
            className="font-[family-name:var(--font-pixel)] text-[9px] mb-2"
            style={{ color: "var(--accent-green)" }}
          >
            MON CHECK-IN
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {mondayCards.map((card) => (
              <CardDisplay
                key={card.id}
                card={card}
                type="monday"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenForm(wsStr, "monday", card.member as TeamMember, card);
                }}
              />
            ))}
          </div>
          <div
            className="font-[family-name:var(--font-pixel)] text-[7px] mb-1"
            style={{ color: "var(--text-muted)" }}
          >
            {mondayCards.length}/{totalMembers} checked in
          </div>
          {!hasMondayCard && (
            <span
              className="subtle-pulse pixel-prompt-hover font-[family-name:var(--font-pixel)] text-[8px]"
              style={{ color: "var(--accent)" }}
            >
              + Check in!
            </span>
          )}
        </button>

        {/* Friday column */}
        <button
          onClick={() => {
            const myCard = fridayCards.find((c) => c.memberId === currentMember.id);
            onOpenForm(wsStr, "friday", myCard ? currentMember : undefined, myCard || undefined);
          }}
          className="p-3 day-cell-hover text-left cursor-pointer"
          style={{
            background: "var(--bg-card)",
            borderTop: "2px solid var(--accent-rose)",
            borderLeft: "none",
            borderRight: "none",
            borderBottom: "none",
          }}
        >
          <div
            className="font-[family-name:var(--font-pixel)] text-[9px] mb-2"
            style={{ color: "var(--accent-rose)" }}
          >
            FRI REFLECTION
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {fridayCards.map((card) => (
              <CardDisplay
                key={card.id}
                card={card}
                type="friday"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenForm(wsStr, "friday", card.member as TeamMember, card);
                }}
              />
            ))}
          </div>
          <div
            className="font-[family-name:var(--font-pixel)] text-[7px] mb-1"
            style={{ color: "var(--text-muted)" }}
          >
            {fridayCards.length}/{totalMembers} reflected
          </div>
          {!hasFridayCard && (
            <span
              className="subtle-pulse pixel-prompt-hover font-[family-name:var(--font-pixel)] text-[8px]"
              style={{ color: "var(--accent)" }}
            >
              + Reflect!
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
