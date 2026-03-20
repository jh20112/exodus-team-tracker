"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCharacterSelection } from "@/components/CharacterSelect";
import PixelButton from "@/components/PixelButton";

export default function InsightsPage() {
  const router = useRouter();
  const { selected, loaded } = useCharacterSelection();

  useEffect(() => {
    if (loaded && !selected) {
      router.push("/");
    }
  }, [loaded, selected, router]);

  if (!loaded || !selected) return null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <div className="relative z-10 text-center fade-in-up">
        <h1
          className="font-[family-name:var(--font-pixel)] text-xl sm:text-2xl"
          style={{
            color: "var(--accent)",
            letterSpacing: "-0.5px",
          }}
        >
          INSIGHTS
        </h1>
        <div
          className="mt-4 mx-auto h-px"
          style={{
            width: "150px",
            background:
              "linear-gradient(90deg, transparent, var(--accent), transparent)",
          }}
        />
      </div>

      <div
        className="shadow-card p-8 text-center fade-in-up"
        style={{
          animationDelay: "0.1s",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <p
          className="font-[family-name:var(--font-pixel)] text-xs subtle-pulse"
          style={{ color: "var(--accent-amber)" }}
        >
          COMING SOON...
        </p>
        <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
          Team analytics and trends will appear here.
        </p>
      </div>

      <div className="fade-in-up" style={{ animationDelay: "0.2s" }}>
        <PixelButton onClick={() => router.push("/")} color="var(--text-muted)">
          {"< back"}
        </PixelButton>
      </div>
    </main>
  );
}
