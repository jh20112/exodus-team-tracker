"use client";

import { useState, useEffect } from "react";
import PixelButton from "./PixelButton";
import { Flower2, Zap, HelpCircle, Trophy, ArrowUpCircle, Battery, Target, Smile, Users } from "lucide-react";
import MetricSelector from "./MetricSelector";
import type { TeamMember, WeeklyCard } from "@/lib/types";

interface FridayCardFormProps {
  member: TeamMember;
  weekStart: string;
  existingCard: WeeklyCard | null;
  onClose: () => void;
  onSave: () => void;
  readOnly?: boolean;
}

export default function FridayCardForm({
  member,
  weekStart,
  existingCard,
  onClose,
  onSave,
  readOnly = false,
}: FridayCardFormProps) {
  const [rose, setRose] = useState(existingCard?.rose || "");
  const [thorn, setThorn] = useState(existingCard?.thorn || "");
  const [curiousMoment, setCuriousMoment] = useState(
    existingCard?.curiousMoment || ""
  );
  const [proudOf, setProudOf] = useState(existingCard?.proudOf || "");
  const [couldImprove, setCouldImprove] = useState(
    existingCard?.couldImprove || ""
  );
  const [metricEnergy, setMetricEnergy] = useState<number | null>(existingCard?.metricEnergy ?? null);
  const [metricGoalCompletion, setMetricGoalCompletion] = useState<number | null>(existingCard?.metricGoalCompletion ?? null);
  const [metricMood, setMetricMood] = useState<number | null>(existingCard?.metricMood ?? null);
  const [metricCollaboration, setMetricCollaboration] = useState<number | null>(existingCard?.metricCollaboration ?? null);
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
        rose,
        thorn,
        curiousMoment,
        proudOf,
        couldImprove,
        metricEnergy,
        metricGoalCompletion,
        metricMood,
        metricCollaboration,
        fridayCompleted: true,
      }),
    });
    setSaving(false);
    onSave();
  };

  const iconClass = "inline-block align-middle mr-1.5";

  const fields = [
    {
      label: "Rose",
      icon: <Flower2 size={14} color="var(--accent-rose)" strokeWidth={1.5} className={iconClass} />,
      color: "var(--accent-rose)",
      value: rose,
      setter: setRose,
      placeholder: "Something good that happened this week",
    },
    {
      label: "Thorn",
      icon: <Zap size={14} color="var(--accent-amber)" strokeWidth={1.5} className={iconClass} />,
      color: "var(--accent-amber)",
      value: thorn,
      setter: setThorn,
      placeholder: "Something challenging this week",
    },
    {
      label: "Curious moment",
      icon: <HelpCircle size={14} color="var(--accent)" strokeWidth={1.5} className={iconClass} />,
      color: "var(--accent)",
      value: curiousMoment,
      setter: setCuriousMoment,
      placeholder: "Something that made you curious",
    },
    {
      label: "Something I'm proud of",
      icon: <Trophy size={14} color="var(--accent-green)" strokeWidth={1.5} className={iconClass} />,
      color: "var(--accent-green)",
      value: proudOf,
      setter: setProudOf,
      placeholder: "What are you proud of?",
    },
    {
      label: "Could have done better",
      icon: <ArrowUpCircle size={14} color="var(--text-muted)" strokeWidth={1.5} className={iconClass} />,
      color: "var(--text-muted)",
      value: couldImprove,
      setter: setCouldImprove,
      placeholder: "What would you improve?",
    },
  ];

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
              FRIDAY REFLECTION
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
          {fields.map((field) => (
            <div key={field.label}>
              <label
                className="font-[family-name:var(--font-pixel)] text-[10px] block mb-2"
                style={{ color: field.color }}
              >
                {field.icon} {field.label}
              </label>
              <textarea
                className="pixel-textarea"
                rows={2}
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                readOnly={readOnly}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>

        {/* Metrics */}
        <div className="mt-6 mb-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1" style={{ background: 'var(--border-default)' }} />
            <span
              className="font-[family-name:var(--font-pixel)] text-[10px]"
              style={{ color: 'var(--text-muted)' }}
            >
              HOW WAS YOUR WEEK?
            </span>
            <div className="h-px flex-1" style={{ background: 'var(--border-default)' }} />
          </div>
          <div className="flex flex-col gap-3">
            <MetricSelector label="Energy" icon={<Battery size={14} strokeWidth={1.5} />} color="var(--accent-green)" value={metricEnergy} onChange={setMetricEnergy} readOnly={readOnly} />
            <MetricSelector label="Goal hit" icon={<Target size={14} strokeWidth={1.5} />} color="var(--accent)" value={metricGoalCompletion} onChange={setMetricGoalCompletion} readOnly={readOnly} />
            <MetricSelector label="Mood" icon={<Smile size={14} strokeWidth={1.5} />} color="var(--accent-amber)" value={metricMood} onChange={setMetricMood} readOnly={readOnly} />
            <MetricSelector label="Collab" icon={<Users size={14} strokeWidth={1.5} />} color="var(--accent-rose)" value={metricCollaboration} onChange={setMetricCollaboration} readOnly={readOnly} />
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
              color="var(--accent-rose)"
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
