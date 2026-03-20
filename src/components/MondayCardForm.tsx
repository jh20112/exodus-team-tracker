"use client";

import { useState, useEffect } from "react";
import PixelButton from "./PixelButton";
import type { TeamMember, WeeklyCard } from "@/lib/types";

interface MondayCardFormProps {
  member: TeamMember;
  weekStart: string;
  existingCard: WeeklyCard | null;
  onClose: () => void;
  onSave: () => void;
  readOnly?: boolean;
}

export default function MondayCardForm({
  member,
  weekStart,
  existingCard,
  onClose,
  onSave,
  readOnly = false,
}: MondayCardFormProps) {
  const [goalOfWeek, setGoalOfWeek] = useState(existingCard?.goalOfWeek || "");
  const [supportRequest, setSupportRequest] = useState(
    existingCard?.supportRequest || ""
  );
  const [generalQuestions, setGeneralQuestions] = useState(
    existingCard?.generalQuestions || ""
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = async () => {
    setSaving(true);
    await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: member.id,
        weekStart,
        goalOfWeek,
        supportRequest,
        generalQuestions,
        mondayCompleted: true,
      }),
    });
    setSaving(false);
    onSave();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-container w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 fade-in-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3
              className="font-[family-name:var(--font-pixel)] text-sm"
              style={{ color: member.color }}
            >
              MONDAY CHECK-IN
            </h3>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {member.name} &middot; Week of {weekStart}
            </p>
          </div>
          <button
            onClick={onClose}
            className="font-[family-name:var(--font-pixel)] text-sm close-btn-hover w-8 h-8 flex items-center justify-center"
            style={{ color: "var(--text-muted)" }}
          >
            ×
          </button>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-5">
          <div>
            <label
              className="font-[family-name:var(--font-pixel)] text-[10px] block mb-2"
              style={{ color: "var(--accent-green)" }}
            >
              Goal of the week
            </label>
            <textarea
              className="pixel-textarea"
              rows={3}
              value={goalOfWeek}
              onChange={(e) => setGoalOfWeek(e.target.value)}
              readOnly={readOnly}
              placeholder="What do you want to accomplish this week?"
            />
          </div>

          <div>
            <label
              className="font-[family-name:var(--font-pixel)] text-[10px] block mb-2"
              style={{ color: "var(--accent-amber)" }}
            >
              Request for support
            </label>
            <textarea
              className="pixel-textarea"
              rows={3}
              value={supportRequest}
              onChange={(e) => setSupportRequest(e.target.value)}
              readOnly={readOnly}
              placeholder="Anything you need help with?"
            />
          </div>

          <div>
            <label
              className="font-[family-name:var(--font-pixel)] text-[10px] block mb-2"
              style={{ color: "var(--accent)" }}
            >
              General questions
            </label>
            <textarea
              className="pixel-textarea"
              rows={3}
              value={generalQuestions}
              onChange={(e) => setGeneralQuestions(e.target.value)}
              readOnly={readOnly}
              placeholder="Questions for the team?"
            />
          </div>
        </div>

        {/* Actions */}
        {!readOnly && (
          <div className="flex justify-end mt-6 gap-4">
            <PixelButton onClick={onClose} color="var(--text-muted)">
              Cancel
            </PixelButton>
            <PixelButton
              onClick={handleSubmit}
              color="var(--accent-green)"
              variant="solid"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </PixelButton>
          </div>
        )}
      </div>
    </div>
  );
}
