"use client";

import { useEffect, useState } from "react";
import type { TeamMember } from "@/lib/types";

const STORAGE_KEY = "exodus-selected-character";

interface CharacterSelectProps {
  members: TeamMember[];
  selected: TeamMember | null;
  onSelect: (member: TeamMember) => void;
}

export function useCharacterSelection() {
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSelected(JSON.parse(stored));
      } catch {}
    }
    setLoaded(true);
  }, []);

  const select = (member: TeamMember) => {
    setSelected(member);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
  };

  const clear = () => {
    setSelected(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { selected, select, clear, loaded };
}

export default function CharacterSelect({ members, selected, onSelect }: CharacterSelectProps) {
  return (
    <div className="flex flex-wrap justify-center gap-5">
      {members.map((member) => {
        const isSelected = selected?.id === member.id;
        return (
          <button
            key={member.id}
            onClick={() => onSelect(member)}
            className="group flex flex-col items-center gap-3"
            style={{
              transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center relative character-card"
              style={{
                border: isSelected ? `1px solid ${member.color || 'var(--accent)'}` : "1px solid var(--border-subtle)",
                background: isSelected ? "var(--bg-elevated)" : "var(--bg-surface)",
                boxShadow: isSelected
                  ? `0 0 20px ${member.color || 'var(--accent)'}20, 0 8px 30px rgba(0,0,0,0.3)`
                  : "0 4px 20px rgba(0,0,0,0.15)",
                transform: isSelected ? "translateY(-2px)" : undefined,
              }}
            >
              <span
                className="font-[family-name:var(--font-pixel)] text-2xl sm:text-3xl character-initial"
                style={{
                  color: isSelected ? (member.color || "var(--text-primary)") : "var(--text-muted)",
                  fontWeight: 400,
                  letterSpacing: "-0.4px",
                  transition: "color 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {member.name[0].toLowerCase()}
              </span>
            </div>
            <span
              className="font-[family-name:var(--font-pixel)] text-[11px] lowercase"
              style={{
                color: isSelected ? "var(--text-primary)" : "var(--text-muted)",
                letterSpacing: "0.5px",
                transition: "color 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {member.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
