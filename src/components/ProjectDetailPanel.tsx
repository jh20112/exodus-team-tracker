"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Plus } from "lucide-react";
import PixelButton from "./PixelButton";
import WorkstreamCard from "./WorkstreamCard";
import type { Project, Workstream, ProjectLink } from "@/lib/types";

interface ProjectDetailPanelProps {
  project: Project;
  nodeColor: string;
  allProjects: Project[];
  focusedWorkstreamId?: string;
  onClose: () => void;
  onUpdate: (updated: Project) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export default function ProjectDetailPanel({
  project,
  nodeColor,
  allProjects,
  focusedWorkstreamId,
  onClose,
  onUpdate,
  onDelete,
  onRefresh,
}: ProjectDetailPanelProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [workstreams, setWorkstreams] = useState<Workstream[]>(project.workstreams || []);
  const [expandedWsId, setExpandedWsId] = useState<string | null>(focusedWorkstreamId || null);
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
    setWorkstreams(project.workstreams || []);
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

  const addWorkstream = async () => {
    const res = await fetch(`/api/projects/${project.id}/workstreams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "new workstream" }),
    });
    if (res.ok) {
      const ws = await res.json();
      setWorkstreams((prev) => [...prev, ws]);
      setExpandedWsId(ws.id);
    }
  };

  const handleDelete = async () => {
    onDelete(project.id);
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
  };

  // Aggregate progress across all workstreams
  const totalItems = workstreams.reduce((sum, ws) => sum + (ws.items?.length || 0), 0);
  const completedItems = workstreams.reduce(
    (sum, ws) => sum + (ws.items?.filter((i) => i.completed).length || 0), 0
  );

  // Links
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
      <div className="modal-container w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 project-panel">
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

        {/* Workstreams header */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="font-[family-name:var(--font-pixel)] text-[10px]"
            style={{ color: "var(--text-muted)" }}
          >
            WORKSTREAMS
          </span>
          <div className="flex items-center gap-3">
            {totalItems > 0 && (
              <span
                className="font-[family-name:var(--font-pixel)] text-[10px]"
                style={{ color: "var(--accent-green)" }}
              >
                {completedItems}/{totalItems}
              </span>
            )}
            <button
              type="button"
              onClick={addWorkstream}
              className="flex items-center gap-1 font-[family-name:var(--font-pixel)] text-[10px] transition-opacity opacity-60 hover:opacity-100"
              style={{ color: nodeColor }}
            >
              <Plus size={12} /> add
            </button>
          </div>
        </div>

        {/* Workstream cards */}
        <div className="mb-4">
          {workstreams.length === 0 && (
            <p
              className="font-[family-name:var(--font-pixel)] text-[10px] py-4 text-center"
              style={{ color: "var(--text-muted)" }}
            >
              no workstreams yet — click + to add one
            </p>
          )}
          {workstreams.map((ws, i) => (
            <WorkstreamCard
              key={ws.id}
              workstream={ws}
              isExpanded={expandedWsId === ws.id}
              accentColor={`color-mix(in oklch, ${nodeColor}, var(--accent-${["green", "amber", "rose"][i % 3]}) 30%)`}
              onToggleExpand={() => setExpandedWsId(expandedWsId === ws.id ? null : ws.id)}
              onRefresh={onRefresh}
            />
          ))}
        </div>

        {/* Links section */}
        {links.length > 0 && (
          <>
            <div
              className="h-px mt-2 mb-4"
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
