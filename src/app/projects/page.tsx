"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCharacterSelection } from "@/components/CharacterSelect";
import ProjectGraph from "@/components/ProjectGraph";
import ProjectDetailPanel from "@/components/ProjectDetailPanel";
import NewLinkModal from "@/components/NewLinkModal";
import PixelButton from "@/components/PixelButton";
import type { Project } from "@/lib/types";

const NODE_COLORS = ["#8aaab8", "#b88aa0", "#8ab89a", "#b8a88a"];

export default function ProjectsPage() {
  const router = useRouter();
  const { selected, loaded } = useCharacterSelection();
  const [ready, setReady] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);

  useEffect(() => {
    if (loaded && !selected) {
      router.push("/");
    } else if (loaded && selected) {
      setReady(true);
    }
  }, [loaded, selected, router]);

  // Fetch projects
  useEffect(() => {
    if (!selected) return;
    fetch(`/api/projects?memberId=${selected.id}`)
      .then((r) => r.json())
      .then(setProjects)
      .catch(console.error);
  }, [selected]);

  const createProject = async () => {
    if (!selected) return;
    // Random position near center
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
    setSelectedProject(project);
  }, []);

  const handleUpdateProjects = useCallback((updated: Project[]) => {
    setProjects(updated);
    // Keep selectedProject in sync if it was updated
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

  const refreshProjects = useCallback(async () => {
    if (!selected) return;
    const res = await fetch(`/api/projects?memberId=${selected.id}`);
    if (res.ok) setProjects(await res.json());
    setShowLinkModal(false);
  }, [selected]);

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
          {projects.length >= 2 && (
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
          memberColor={selected.color}
          onSelectProject={handleSelectProject}
          onUpdateProjects={handleUpdateProjects}
        />
      </div>

      {/* Detail panel */}
      {selectedProject && (
        <ProjectDetailPanel
          project={selectedProject}
          nodeColor={selectedProject.color || NODE_COLORS[projects.indexOf(selectedProject) % NODE_COLORS.length]}
          allProjects={projects}
          onClose={() => setSelectedProject(null)}
          onUpdate={handleProjectUpdate}
          onDelete={handleProjectDelete}
          onRefresh={refreshProjects}
        />
      )}
      {/* Link modal */}
      {showLinkModal && (
        <NewLinkModal
          projects={projects}
          onClose={() => setShowLinkModal(false)}
          onCreated={refreshProjects}
        />
      )}
    </main>
  );
}
