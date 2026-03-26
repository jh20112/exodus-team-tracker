"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import type { ChecklistItem } from "@/lib/types";

interface ChecklistItemRowProps {
  item: ChecklistItem;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

export default function ChecklistItemRow({ item, onToggle, onEdit, onDelete }: ChecklistItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commitEdit = () => {
    setEditing(false);
    const trimmed = text.trim();
    if (trimmed && trimmed !== item.text) {
      onEdit(item.id, trimmed);
    } else {
      setText(item.text);
    }
  };

  return (
    <div className="group flex items-center gap-3 py-1.5">
      <button
        type="button"
        className={`checklist-checkbox ${item.completed ? "checked" : ""}`}
        onClick={() => onToggle(item.id, !item.completed)}
        aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
      />
      {editing ? (
        <input
          ref={inputRef}
          className="flex-1 bg-transparent border-b font-[family-name:var(--font-pixel)] text-xs outline-none"
          style={{
            color: "var(--text-primary)",
            borderColor: "var(--accent)",
          }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") { setText(item.text); setEditing(false); }
          }}
        />
      ) : (
        <span
          className={`flex-1 font-[family-name:var(--font-pixel)] text-xs cursor-text ${item.completed ? "checklist-text-done" : ""}`}
          style={{ color: item.completed ? "var(--text-muted)" : "var(--text-primary)" }}
          onClick={() => setEditing(true)}
        >
          {item.text}
        </span>
      )}
      <button
        type="button"
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: "var(--text-muted)" }}
        onClick={() => onDelete(item.id)}
        aria-label="Delete item"
      >
        <X size={14} />
      </button>
    </div>
  );
}
