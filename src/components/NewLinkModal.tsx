"use client";

import { useState, useEffect } from "react";
import PixelButton from "./PixelButton";
import type { Project } from "@/lib/types";

interface NewLinkModalProps {
  projects: Project[];
  onClose: () => void;
  onCreated: () => void;
}

export default function NewLinkModal({ projects, onClose, onCreated }: NewLinkModalProps) {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const canSave = fromId && toId && fromId !== toId;

  const handleSubmit = async () => {
    if (!canSave) return;
    setSaving(true);
    const res = await fetch("/api/projects/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromId, toId, description: description.trim() || null }),
    });
    setSaving(false);
    if (res.ok) onCreated();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-container w-full max-w-sm p-6 project-panel">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3
            className="font-[family-name:var(--font-pixel)] text-sm"
            style={{ color: "var(--accent)" }}
          >
            NEW LINK
          </h3>
          <button
            onClick={onClose}
            className="font-[family-name:var(--font-pixel)] text-sm close-btn-hover w-8 h-8 flex items-center justify-center"
            style={{ color: "var(--text-muted)" }}
          >
            ×
          </button>
        </div>

        {/* From */}
        <div className="mb-4">
          <label
            className="font-[family-name:var(--font-pixel)] text-[10px] block mb-2"
            style={{ color: "var(--accent-green)" }}
          >
            FROM
          </label>
          <select
            className="w-full bg-[var(--bg-dark)] border font-[family-name:var(--font-pixel)] text-xs outline-none px-3 py-2"
            style={{
              color: "var(--text-primary)",
              borderColor: "var(--border-default)",
            }}
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
          >
            <option value="">select a project...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* To */}
        <div className="mb-4">
          <label
            className="font-[family-name:var(--font-pixel)] text-[10px] block mb-2"
            style={{ color: "var(--accent-rose)" }}
          >
            TO
          </label>
          <select
            className="w-full bg-[var(--bg-dark)] border font-[family-name:var(--font-pixel)] text-xs outline-none px-3 py-2"
            style={{
              color: "var(--text-primary)",
              borderColor: "var(--border-default)",
            }}
            value={toId}
            onChange={(e) => setToId(e.target.value)}
          >
            <option value="">select a project...</option>
            {projects.filter((p) => p.id !== fromId).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label
            className="font-[family-name:var(--font-pixel)] text-[10px] block mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            HOW ARE THEY CONNECTED?
          </label>
          <textarea
            className="pixel-textarea"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="describe the relationship..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <PixelButton onClick={onClose} color="var(--text-muted)">
            Cancel
          </PixelButton>
          <PixelButton
            onClick={handleSubmit}
            color="var(--accent)"
            variant="solid"
            disabled={!canSave || saving}
          >
            {saving ? "Saving..." : "Create link"}
          </PixelButton>
        </div>
      </div>
    </div>
  );
}
