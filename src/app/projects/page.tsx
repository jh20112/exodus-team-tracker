"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCharacterSelection } from "@/components/CharacterSelect";
import ProjectGraph from "@/components/ProjectGraph";
import ProjectDetailPanel from "@/components/ProjectDetailPanel";
import NewLinkModal from "@/components/NewLinkModal";
import PixelButton from "@/components/PixelButton";
import type { Project, ProjectLink } from "@/lib/types";

const NODE_COLORS = ["#8aaab8", "#b88aa0", "#8ab89a", "#b8a88a"];

export default function ProjectsPage() {
  const router = useRouter();
  const { selected, loaded } = useCharacterSelection();
  const [ready, setReady] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [links, setLinks] = useState<ProjectLink[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [focusedWorkstreamId, setFocusedWorkstreamId] = useState<string | undefined>(undefined);
  const [showLinkModal, setShowLinkModal] = useState(false);

  useEffect(() => {
    if (loaded && !selected) {
      router.push("/");
    } else if (loaded && selected) {
      setReady(true);
    }
  }, [loaded, selected, router]);

  const fetchLinks = useCallback(async (projs: Project[]) => {
    // Collect all project + workstream IDs
    const ids: string[] = [];
    for (const p of projs) {
      ids.push(p.id);
      for (const ws of p.workstreams || []) {
        ids.push(ws.id);
      }
    }
    if (ids.length === 0) { setLinks([]); return; }
    const res = await fetch(`/api/projects/links?ids=${ids.join(",")}`);
    if (res.ok) setLinks(await res.json());
  }, []);

  // Fetch projects + links
  useEffect(() => {
    if (!selected) return;
    fetch(`/api/projects?memberId=${selected.id}`)
      .then((r) => r.json())
      .then((projs) => {
        setProjects(projs);
        fetchLinks(projs);
      })
      .catch(console.error);
  }, [selected, fetchLinks]);

  const createProject = async () => {
    if (!selected) return;
    const posX = 0.35 + Math.random() * 0.3;
    const posY = 0.3 + Math.random() * 0.4;

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: selected.id,
        name: "new project",
        posX,
        posY,
      }),
    });
    if (res.ok) {
      const project = await res.json();
      setProjects((prev) => [...prev, project]);
      setSelectedProject(project);
    }
  };

  const handleSelectProject = useCallback((project: Project) => {
    setFocusedWorkstreamId(undefined);
    setSelectedProject(project);
  }, []);

  const handleSelectWorkstream = useCallback((project: Project, workstreamId: string) => {
    setFocusedWorkstreamId(workstreamId);
    setSelectedProject(project);
  }, []);

  const handleUpdateProjects = useCallback((updated: Project[]) => {
    setProjects(updated);
    if (selectedProject) {
      const refreshed = updated.find((p) => p.id === selectedProject.id);
      if (refreshed) setSelectedProject(refreshed);
    }
  }, [selectedProject]);

  const handleProjectUpdate = useCallback((updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedProject(updated);
  }, []);

  const handleProjectDelete = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setSelectedProject(null);
  }, []);

  const refreshAll = useCallback(async () => {
    if (!selected) return;
    const res = await fetch(`/api/projects?memberId=${selected.id}`);
    if (res.ok) {
      const updated = await res.json();
      setProjects(updated);
      fetchLinks(updated);
      if (selectedProject) {
        const refreshed = updated.find((p: Project) => p.id === selectedProject.id);
        if (refreshed) setSelectedProject(refreshed);
      }
    }
    setShowLinkModal(false);
  }, [selected, selectedProject, fetchLinks]);

  // Count linkable nodes (projects + workstreams)
  const linkableCount = projects.length + projects.reduce((sum, p) => sum + (p.workstreams?.length || 0), 0);

  if (!ready || !selected) return null;

  return (
    <main className="relative min-h-screen">
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between p-4 sm:p-8 fade-in-up">
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
        <div className="flex flex-col gap-2">
          <PixelButton onClick={createProject} color="var(--accent)">
            + new project
          </PixelButton>
          {linkableCount >= 2 && (
            <PixelButton onClick={() => setShowLinkModal(true)} color="var(--text-muted)">
              + new link
            </PixelButton>
          )}
        </div>
      </div>

      {/* Graph */}
      <div className="relative z-10" style={{ height: "calc(100vh - 80px)" }}>
        <ProjectGraph
          projects={projects}
          links={links}
          memberColor={selected.color}
          onSelectProject={handleSelectProject}
          onSelectWorkstream={handleSelectWorkstream}
          onUpdateProjects={handleUpdateProjects}
        />
      </div>

      {/* Detail panel */}
      {selectedProject && (
        <ProjectDetailPanel
          project={selectedProject}
          nodeColor={selectedProject.color || NODE_COLORS[projects.indexOf(selectedProject) % NODE_COLORS.length]}
          allProjects={projects}
          links={links}
          focusedWorkstreamId={focusedWorkstreamId}
          onClose={() => { setSelectedProject(null); setFocusedWorkstreamId(undefined); }}
          onUpdate={handleProjectUpdate}
          onDelete={handleProjectDelete}
          onRefresh={refreshAll}
        />
      )}
      {/* Link modal */}
      {showLinkModal && (
        <NewLinkModal
          projects={projects}
          onClose={() => setShowLinkModal(false)}
          onCreated={refreshAll}
        />
      )}
    </main>
  );
}
