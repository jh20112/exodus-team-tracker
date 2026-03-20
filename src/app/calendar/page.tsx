"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCharacterSelection } from "@/components/CharacterSelect";
import WeeklyTracker from "@/components/WeeklyTracker";
import PixelButton from "@/components/PixelButton";

export default function CalendarPage() {
  const router = useRouter();
  const { selected, loaded } = useCharacterSelection();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loaded && !selected) {
      router.push("/");
    } else if (loaded && selected) {
      setReady(true);
    }
  }, [loaded, selected, router]);

  if (!ready || !selected) return null;

  return (
    <main className="min-h-screen p-4 sm:p-8">
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between mb-10 max-w-5xl mx-auto fade-in-up">
        <PixelButton onClick={() => router.push("/")} color="var(--text-muted)">
          {"< home"}
        </PixelButton>
        <div
          className="flex items-center gap-3 px-3 py-1.5"
          style={{
            background: `${selected.color}10`,
            border: `1px solid ${selected.color}25`,
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: selected.color }}
          />
          <span
            className="font-[family-name:var(--font-pixel)] text-xs"
            style={{ color: selected.color }}
          >
            {selected.name}
          </span>
        </div>
      </div>

      <WeeklyTracker currentMember={selected} />
    </main>
  );
}
