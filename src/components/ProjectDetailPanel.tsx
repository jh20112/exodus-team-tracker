"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import PixelButton from "./PixelButton";
import ChecklistItemRow from "./ChecklistItemRow";
import { X } from "lucide-react";
import type { Project, ChecklistItem, ProjectLink } from "@/lib/types";

interface ProjectDetailPanelProps {
  project: Project;
  nodeColor: string;
  allProjects: Project[];
  onClose: () => void;
  onUpdate: (updated: Project) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export default function ProjectDetailPanel({
  project,
  nodeColor,
  allProjects,
  onClose,
  onUpdate,
  onDelete,
  onRefresh,
}: ProjectDetailPanelProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [items, setItems] = useState<ChecklistItem[]>(project.items || []);
  const [newItemText, setNewItemText] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (project.name === "new project") {
      nameRef.current?.focus();
      nameRef.current?.select();
    }
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Sync when project prop changes
  useEffect(() => {
    setName(project.name);
    setDescription(project.description || "");
    setItems(project.items || []);
  }, [project]);

  const saveField = useCallback(async (field: string, value: string) => {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdate(updated);
    }
  }, [project.id, onUpdate]);

  const addItem = async () => {
    const trimmed = newItemText.trim();
    if (!trimmed) return;
    setNewItemText("");
    const res = await fetch(`/api/projects/${project.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });
    if (res.ok) {
      const item = await res.json();
      setItems((prev) => [...prev, item]);
      onUpdate({ ...project, items: [...items, item] });
    }
  };

  const toggleItem = async (id: string, completed: boolean) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, completed } : i)));
    await fetch(`/api/projects/${project.id}/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
  };

  const editItem = async (id: string, text: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, text } : i)));
    await fetch(`/api/projects/${project.id}/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  };

  const deleteItem = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/projects/${project.id}/items/${id}`, {
      method: "DELETE",
    });
  };

  const handleDelete = async () => {
    onDelete(project.id);
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
  };

  const completedCount = items.filter((i) => i.completed).length;

  // Gather links for this project
  const links: (ProjectLink & { otherName: string })[] = [
    ...(project.linksFrom || []).map((l) => ({
      ...l,
      otherName: allProjects.find((p) => p.id === l.toId)?.name || "unknown",
    })),
    ...(project.linksTo || []).map((l) => ({
      ...l,
      otherName: allProjects.find((p) => p.id === l.fromId)?.name || "unknown",
    })),
  ];

  const updateLinkDescription = async (linkId: string, desc: string) => {
    await fetch("/api/projects/links", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: linkId, description: desc.trim() || null }),
    });
    onRefresh();
  };

  const deleteLink = async (linkId: string) => {
    await fetch("/api/projects/links", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: linkId }),
    });
    onRefresh();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-container w-full max-w-md max-h-[90vh] overflow-y-auto p-6 project-panel">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <input
            ref={nameRef}
            className="flex-1 bg-transparent font-[family-name:var(--font-pixel)] text-sm outline-none"
            style={{ color: nodeColor }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name.trim() && name !== project.name) saveField("name", name.trim());
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            placeholder="project name"
          />
          <button
            onClick={onClose}
            className="font-[family-name:var(--font-pixel)] text-sm close-btn-hover w-8 h-8 flex items-center justify-center flex-shrink-0"
            style={{ color: "var(--text-muted)" }}
          >
            ×
          </button>
        </div>

        {/* Description */}
        <textarea
          className="pixel-textarea mb-4"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => {
            if (description !== (project.description || "")) saveField("description", description);
          }}
          placeholder="add a description..."
        />

        {/* Divider */}
        <div
          className="h-px mb-4"
          style={{
            background: "linear-gradient(90deg, transparent, var(--border-default), transparent)",
          }}
        />

        {/* Checklist header */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="font-[family-name:var(--font-pixel)] text-[10px]"
            style={{ color: "var(--text-muted)" }}
          >
            CHECKLIST
          </span>
          {items.length > 0 && (
            <span
              className="font-[family-name:var(--font-pixel)] text-[10px]"
              style={{ color: "var(--accent-green)" }}
            >
              {completedCount}/{items.length}
            </span>
          )}
        </div>

        {/* Checklist items */}
        <div className="flex flex-col mb-3">
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
          className="w-full bg-transparent border-b font-[family-name:var(--font-pixel)] text-xs outline-none py-2"
          style={{
            color: "var(--text-primary)",
            borderColor: "var(--border-default)",
          }}
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addItem();
          }}
          placeholder="+ add item..."
        />

        {/* Links section */}
        {links.length > 0 && (
          <>
            <div
              className="h-px mt-5 mb-4"
              style={{
                background: "linear-gradient(90deg, transparent, var(--border-default), transparent)",
              }}
            />
            <div className="flex items-center justify-between mb-3">
              <span
                className="font-[family-name:var(--font-pixel)] text-[10px]"
                style={{ color: "var(--text-muted)" }}
              >
                LINKS
              </span>
            </div>
            <div className="flex flex-col gap-3 mb-3">
              {links.map((link) => (
                <LinkRow
                  key={link.id}
                  link={link}
                  onUpdateDescription={updateLinkDescription}
                  onDelete={deleteLink}
                />
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex justify-end mt-6">
          <PixelButton onClick={handleDelete} color="var(--accent-rose)">
            delete project
          </PixelButton>
        </div>
      </div>
    </div>
  );
}

function LinkRow({
  link,
  onUpdateDescription,
  onDelete,
}: {
  link: { id: string; description: string | null; otherName: string };
  onUpdateDescription: (id: string, desc: string) => void;
  onDelete: (id: string) => void;
}) {
  const [desc, setDesc] = useState(link.description || "");

  return (
    <div className="group flex flex-col gap-1.5 p-2" style={{ background: "var(--bg-dark)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex items-center justify-between">
        <span
          className="font-[family-name:var(--font-pixel)] text-[10px]"
          style={{ color: "var(--accent)" }}
        >
          → {link.otherName}
        </span>
        <button
          type="button"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "var(--text-muted)" }}
          onClick={() => onDelete(link.id)}
          aria-label="Delete link"
        >
          <X size={12} />
        </button>
      </div>
      <input
        className="w-full bg-transparent font-[family-name:var(--font-pixel)] text-[10px] outline-none"
        style={{ color: "var(--text-muted)" }}
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        onBlur={() => {
          if (desc !== (link.description || "")) onUpdateDescription(link.id, desc);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        placeholder="describe this connection..."
      />
    </div>
  );
}
