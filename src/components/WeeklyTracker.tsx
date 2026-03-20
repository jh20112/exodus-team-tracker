"use client";

import { useState, useEffect, useCallback } from "react";
import { getWeekStart, formatDate } from "@/lib/utils";
import type { TeamMember, WeeklyCard } from "@/lib/types";
import WeekRow from "./WeekRow";
import MondayCardForm from "./MondayCardForm";
import FridayCardForm from "./FridayCardForm";
import PixelButton from "./PixelButton";

interface WeeklyTrackerProps {
  currentMember: TeamMember;
}

interface ModalState {
  type: "monday" | "friday";
  weekStart: string;
  member: TeamMember;
  card: WeeklyCard | null;
  readOnly: boolean;
}

export default function WeeklyTracker({ currentMember }: WeeklyTrackerProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    getWeekStart(new Date())
  );
  const [cards, setCards] = useState<WeeklyCard[]>([]);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);

  const fetchCards = useCallback(() => {
    // Fetch cards for a ~2-month window around currentWeekStart
    const date = new Date(currentWeekStart);
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    // Also fetch previous month to cover past weeks
    const prevDate = new Date(date);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

    Promise.all([
      fetch(`/api/cards?month=${monthStr}`).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      fetch(`/api/cards?month=${prevMonthStr}`).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    ]).then(([current, prev]) => {
      // Deduplicate by card id
      const map = new Map<string, WeeklyCard>();
      for (const c of [...prev, ...current]) {
        map.set(c.id, c);
      }
      setCards(Array.from(map.values()));
    }).catch((err) => console.error("Failed to load cards:", err));
  }, [currentWeekStart]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Generate past week starts (5 weeks before current)
  const pastWeeks: Date[] = [];
  for (let i = 1; i <= 5; i++) {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7 * i);
    pastWeeks.push(d);
  }

  const navigateWeek = (direction: -1 | 1) => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7 * direction);
    setCurrentWeekStart(next);
    setExpandedWeek(null);
  };

  const weekLabel = currentWeekStart
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();

  const openForm = (
    weekStart: string,
    type: "monday" | "friday",
    member?: TeamMember,
    card?: WeeklyCard
  ) => {
    const isOwnCard = !member || member.id === currentMember.id;
    setModal({
      type,
      weekStart,
      member: member || currentMember,
      card: card || null,
      readOnly: !isOwnCard,
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto" key={formatDate(currentWeekStart)}>
      {/* Week header */}
      <div
        className="flex items-center justify-between mb-8 fade-in-up"
      >
        <PixelButton onClick={() => navigateWeek(-1)} color="var(--text-muted)">
          {"<"}
        </PixelButton>
        <h2
          className="font-[family-name:var(--font-pixel)] text-sm sm:text-lg"
          style={{ color: "var(--accent)", letterSpacing: "1px" }}
        >
          WEEK OF {weekLabel}
        </h2>
        <PixelButton onClick={() => navigateWeek(1)} color="var(--text-muted)">
          {">"}
        </PixelButton>
      </div>

      {/* Current week — always expanded */}
      <div className="fade-in-up" style={{ animationDelay: "0.1s" }}>
        <WeekRow
          weekStart={currentWeekStart}
          cards={cards}
          currentMember={currentMember}
          expanded={true}
          onToggle={() => {}}
          onOpenForm={openForm}
        />
      </div>

      {/* Divider */}
      <div
        className="h-px my-8 fade-in-up"
        style={{
          animationDelay: "0.2s",
          background:
            "linear-gradient(90deg, transparent, var(--border-default) 30%, var(--border-default) 70%, transparent)",
        }}
      />

      {/* Past weeks */}
      <div
        className="flex flex-col gap-2 fade-in-up"
        style={{ animationDelay: "0.3s" }}
      >
        <h3
          className="font-[family-name:var(--font-pixel)] text-[9px] mb-2"
          style={{ color: "var(--text-muted)", letterSpacing: "2px" }}
        >
          PAST WEEKS
        </h3>
        {pastWeeks.map((ws) => {
          const key = formatDate(ws);
          return (
            <div key={key} className="week-row-expand">
              <WeekRow
                weekStart={ws}
                cards={cards}
                currentMember={currentMember}
                expanded={expandedWeek === key}
                onToggle={() =>
                  setExpandedWeek(expandedWeek === key ? null : key)
                }
                onOpenForm={openForm}
              />
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {modal && modal.type === "monday" && (
        <MondayCardForm
          member={modal.member}
          weekStart={modal.weekStart}
          existingCard={modal.card}
          readOnly={modal.readOnly}
          onClose={() => setModal(null)}
          onSave={() => {
            setModal(null);
            fetchCards();
          }}
        />
      )}
      {modal && modal.type === "friday" && (
        <FridayCardForm
          member={modal.member}
          weekStart={modal.weekStart}
          existingCard={modal.card}
          readOnly={modal.readOnly}
          onClose={() => setModal(null)}
          onSave={() => {
            setModal(null);
            fetchCards();
          }}
        />
      )}
    </div>
  );
}
