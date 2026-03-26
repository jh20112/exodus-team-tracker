"use client";

import { useState } from "react";
import { ChevronRight, Trash2 } from "lucide-react";
import ChecklistItemRow from "./ChecklistItemRow";
import type { Workstream, ChecklistItem } from "@/lib/types";

interface WorkstreamCardProps {
  workstream: Workstream;
  isExpanded: boolean;
  accentColor: string;
  onToggleExpand: () => void;
  onRefresh: () => void;
}

export default function WorkstreamCard({
  workstream,
  isExpanded,
  accentColor,
  onToggleExpand,
  onRefresh,
}: WorkstreamCardProps) {
  const [name, setName] = useState(workstream.name);
  const [items, setItems] = useState<ChecklistItem[]>(workstream.items || []);
  const [newItemText, setNewItemText] = useState("");

  // Sync on prop change
  if (workstream.items && workstream.items !== items && JSON.stringify(workstream.items) !== JSON.stringify(items)) {
    setItems(workstream.items);
  }
  if (workstream.name !== name && !document.activeElement?.closest(`[data-ws-id="${workstream.id}"]`)) {
    setName(workstream.name);
  }

  const completedCount = items.filter((i) => i.completed).length;

  const saveName = async () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== workstream.name) {
      await fetch(`/api/workstreams/${workstream.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      onRefresh();
    }
  };

  const addItem = async () => {
    const trimmed = newItemText.trim();
    if (!trimmed) return;
    setNewItemText("");
    const res = await fetch(`/api/workstreams/${workstream.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });
    if (res.ok) {
      const item = await res.json();
      setItems((prev) => [...prev, item]);
    }
  };

  const toggleItem = async (id: string, completed: boolean) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, completed } : i)));
    await fetch(`/api/workstreams/${workstream.id}/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
  };

  const editItem = async (id: string, text: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, text } : i)));
    await fetch(`/api/workstreams/${workstream.id}/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  };

  const deleteItem = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/workstreams/${workstream.id}/items/${id}`, {
      method: "DELETE",
    });
  };

  const deleteWorkstream = async () => {
    await fetch(`/api/workstreams/${workstream.id}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <div
      data-ws-id={workstream.id}
      style={{ borderLeft: `2px solid ${accentColor}` }}
      className="mb-2"
    >
      {/* Header — always visible */}
      <button
        type="button"
        className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors"
        style={{ background: isExpanded ? "var(--bg-dark)" : "transparent" }}
        onClick={onToggleExpand}
      >
        <ChevronRight
          size={12}
          className="transition-transform flex-shrink-0"
          style={{
            color: accentColor,
            transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
          }}
        />
        <span
          className="flex-1 font-[family-name:var(--font-pixel)] text-[11px]"
          style={{ color: "var(--text-primary)" }}
        >
          {workstream.name}
        </span>
        {items.length > 0 && (
          <span
            className="font-[family-name:var(--font-pixel)] text-[10px]"
            style={{ color: "var(--accent-green)" }}
          >
            {completedCount}/{items.length}
          </span>
        )}
      </button>

      {/* Expandable content */}
      <div className={`ws-card-content ${isExpanded ? "expanded" : ""}`}>
        <div className="ws-card-inner">
          <div className="px-3 pb-3 pt-1" style={{ background: "var(--bg-dark)" }}>
            {/* Editable name */}
            <input
              className="w-full bg-transparent font-[family-name:var(--font-pixel)] text-[10px] outline-none mb-3"
              style={{ color: accentColor, borderBottom: `1px solid var(--border-subtle)` }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              placeholder="workstream name"
            />

            {/* Checklist items */}
            <div className="flex flex-col mb-2">
              {items.map((item) => (
                <ChecklistItemRow
                  key={item.id}
                  item={item}
                  onToggle={toggleItem}
                  onEdit={editItem}
                  onDelete={deleteItem}
                />
              ))}
            </div>

            {/* Add item */}
            <input
              className="w-full bg-transparent border-b font-[family-name:var(--font-pixel)] text-xs outline-none py-1.5"
              style={{
                color: "var(--text-primary)",
                borderColor: "var(--border-default)",
              }}
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addItem(); }}
              placeholder="+ add item..."
            />

            {/* Delete workstream */}
            <button
              type="button"
              className="flex items-center gap-1.5 mt-3 font-[family-name:var(--font-pixel)] text-[9px] transition-opacity opacity-50 hover:opacity-100"
              style={{ color: "var(--accent-rose)" }}
              onClick={deleteWorkstream}
            >
              <Trash2 size={10} /> delete workstream
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
