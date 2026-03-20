"use client";

import { useEffect, useState } from "react";
import CharacterSelect, {
  useCharacterSelection,
} from "@/components/CharacterSelect";
import NavButtons from "@/components/NavButtons";
import type { TeamMember } from "@/lib/types";

export default function Home() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const { selected, select, loaded } = useCharacterSelection();

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then(setMembers);
  }, []);

  if (!loaded) return null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-14 p-8">
      {/* Title */}
      <div className="relative z-10 text-center fade-in-up" style={{ animationDelay: "0s" }}>
        <h1
          className="font-[family-name:var(--font-pixel)] text-6xl sm:text-8xl leading-none"
          style={{
            color: "var(--text-primary)",
            letterSpacing: "-2px",
            textTransform: "lowercase",
          }}
        >
          exodus
        </h1>
        <p
          className="font-[family-name:var(--font-pixel)] text-[10px] sm:text-xs mt-5"
          style={{
            color: "var(--text-muted)",
            letterSpacing: "6px",
            textTransform: "uppercase",
          }}
        >
          team tracker
        </p>
        <div
          className="mt-8 mx-auto"
          style={{
            width: "120px",
            height: "1px",
            background: "linear-gradient(90deg, transparent, var(--border-default), transparent)",
          }}
        />
      </div>

      {/* Navigation */}
      <div className="fade-in-up" style={{ animationDelay: "0.1s" }}>
        <NavButtons selected={selected} />
      </div>

      {/* Character Selection */}
      <div className="relative z-10 flex flex-col items-center gap-6 fade-in-up" style={{ animationDelay: "0.2s" }}>
        <p
          className="font-[family-name:var(--font-pixel)] text-[10px]"
          style={{
            color: "var(--text-muted)",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          select your team member
        </p>
        <CharacterSelect
          members={members}
          selected={selected}
          onSelect={select}
        />
      </div>

    </main>
  );
}
