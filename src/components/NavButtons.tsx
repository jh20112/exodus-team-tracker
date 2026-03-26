"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PixelButton from "./PixelButton";
import type { TeamMember } from "@/lib/types";

interface NavButtonsProps {
  selected: TeamMember | null;
}

export default function NavButtons({ selected }: NavButtonsProps) {
  const router = useRouter();
  const [warning, setWarning] = useState(false);

  const navigate = (path: string) => {
    if (!selected) {
      setWarning(true);
      setTimeout(() => setWarning(false), 2000);
      return;
    }
    router.push(path);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-6">
        <PixelButton onClick={() => navigate("/calendar")} color="var(--text-primary)">
          Calendar
        </PixelButton>
        <PixelButton onClick={() => navigate("/projects")} color="var(--text-primary)">
          Projects
        </PixelButton>
        <PixelButton
          onClick={() => navigate("/insights")}
          color="var(--text-primary)"
        >
          Insights
        </PixelButton>
      </div>
      {warning && (
        <p
          className="font-[family-name:var(--font-pixel)] text-xs fade-in-up"
          style={{ color: "var(--accent-amber)" }}
        >
          Select your team member first
        </p>
      )}
    </div>
  );
}
