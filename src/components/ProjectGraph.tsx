"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { normalizedToScreen, screenToNormalized, hitTestNode } from "@/lib/graphUtils";
import type { Project, ProjectLink } from "@/lib/types";

interface ProjectGraphProps {
  projects: Project[];
  links: ProjectLink[];
  memberColor: string;
  onSelectProject: (project: Project) => void;
  onSelectWorkstream: (project: Project, workstreamId: string) => void;
  onUpdateProjects: (projects: Project[]) => void;
}

const CFG = {
  nodeRadius: 18,
  hoverScale: 1.15,
  pulseSpeed: 0.6,
  linkOpacity: 0.3,
  linkWidth: 1.5,
  glowLinkWidth: 3,
  glowLinkOpacity: 0.12,
  hitPadding: 8,
  dragThreshold: 5,
  nameOffsetY: 30,
  // Workstream satellite config
  wsNodeRadius: 9,
  wsOrbitDistance: 60,
  wsLinkWidth: 0.6,
  wsLinkOpacity: 0.18,
  wsNameOffsetY: 16,
};

const COLORS = ["#8aaab8", "#b88aa0", "#8ab89a", "#b8a88a"];

interface ScreenNode {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  name: string;
  progress: number;
  type: "project" | "workstream";
  parentId?: string;
  project: Project;
  workstreamId?: string;
}

export default function ProjectGraph({
  projects,
  links,
  memberColor,
  onSelectProject,
  onSelectWorkstream,
  onUpdateProjects,
}: ProjectGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef(projects);
  const [cursorClass, setCursorClass] = useState("");
  const linksRef = useRef(links);

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  useEffect(() => {
    linksRef.current = links;
  }, [links]);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    const containerEl = containerRef.current;
    if (!canvasEl || !containerEl) return;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0, dpr = 1;
    let rafId: number;
    let lastTime = 0;

    let hoveredId: string | null = null;
    let dragId: string | null = null;
    let dragStartX = 0, dragStartY = 0;
    let dragMoved = false;

    const glowCache = new Map<string, { canvas: HTMLCanvasElement; size: number }>();

    function getGlowSprite(color: string, radius: number) {
      const key = color + "|" + Math.round(radius);
      if (glowCache.has(key)) return glowCache.get(key)!;
      const size = Math.ceil(radius * 6);
      const oc = document.createElement("canvas");
      oc.width = size * 2;
      oc.height = size * 2;
      const octx = oc.getContext("2d")!;
      const grad = octx.createRadialGradient(size, size, 0, size, size, size);
      grad.addColorStop(0, color + "70");
      grad.addColorStop(0.3, color + "30");
      grad.addColorStop(1, color + "00");
      octx.fillStyle = grad;
      octx.fillRect(0, 0, size * 2, size * 2);
      const entry = { canvas: oc, size };
      glowCache.set(key, entry);
      return entry;
    }

    function resize() {
      dpr = window.devicePixelRatio || 1;
      const rect = containerEl!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvasEl!.width = W * dpr;
      canvasEl!.height = H * dpr;
      canvasEl!.style.width = W + "px";
      canvasEl!.style.height = H + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function getScreenNodes(t: number): ScreenNode[] {
      const nodes: ScreenNode[] = [];

      projectsRef.current.forEach((p, i) => {
        const pos = normalizedToScreen(p.posX, p.posY, W, H);
        const pulse = 1 + Math.sin(t * 0.001 * CFG.pulseSpeed + i * 1.3) * 0.04;
        const color = p.color || COLORS[i % COLORS.length];

        // Aggregate progress from workstreams
        const allItems = (p.workstreams || []).flatMap((ws) => ws.items || []);
        const totalItems = allItems.length;
        const completedItems = allItems.filter((it) => it.completed).length;

        const projectNode: ScreenNode = {
          id: p.id,
          x: pos.x,
          y: pos.y,
          radius: CFG.nodeRadius * pulse * (hoveredId === p.id ? CFG.hoverScale : 1),
          color,
          name: p.name,
          progress: totalItems > 0 ? completedItems / totalItems : 0,
          type: "project",
          project: p,
        };
        nodes.push(projectNode);

        // Workstream satellite nodes
        const wsList = p.workstreams || [];
        wsList.forEach((ws, wi) => {
          const angle = (2 * Math.PI * wi / wsList.length) - Math.PI / 2;
          const wsX = pos.x + Math.cos(angle) * CFG.wsOrbitDistance;
          const wsY = pos.y + Math.sin(angle) * CFG.wsOrbitDistance;
          const wsPulse = 1 + Math.sin(t * 0.001 * CFG.pulseSpeed + wi * 2.1) * 0.03;
          const wsItems = ws.items || [];
          const wsCompleted = wsItems.filter((it) => it.completed).length;

          nodes.push({
            id: `ws-${ws.id}`,
            x: wsX,
            y: wsY,
            radius: CFG.wsNodeRadius * wsPulse * (hoveredId === `ws-${ws.id}` ? CFG.hoverScale : 1),
            color,
            name: ws.name,
            progress: wsItems.length > 0 ? wsCompleted / wsItems.length : 0,
            type: "workstream",
            parentId: p.id,
            project: p,
            workstreamId: ws.id,
          });
        });
      });

      return nodes;
    }

    function render(t: number) {
      ctx!.clearRect(0, 0, W, H);
      const allNodes = getScreenNodes(t);
      const projectNodes = allNodes.filter((n) => n.type === "project");
      const wsNodes = allNodes.filter((n) => n.type === "workstream");
      const links = linksRef.current;

      // 1. Draw workstream-to-parent connector lines
      ctx!.lineWidth = CFG.wsLinkWidth;
      for (const ws of wsNodes) {
        const parent = projectNodes.find((n) => n.id === ws.parentId);
        if (!parent) continue;
        ctx!.strokeStyle = `rgba(180, 200, 210, ${CFG.wsLinkOpacity})`;
        ctx!.beginPath();
        ctx!.moveTo(parent.x, parent.y);
        ctx!.lineTo(ws.x, ws.y);
        ctx!.stroke();
      }

      // 2. Draw cross-node links (project-to-project, workstream-to-workstream, etc.)
      // Build a lookup of all node positions by their real ID
      const nodeById = new Map<string, { x: number; y: number }>();
      for (const n of projectNodes) nodeById.set(n.id, n);
      for (const n of wsNodes) nodeById.set(n.workstreamId || n.id, n);

      const linkLines = links.map((l) => {
        const from = nodeById.get(l.fromId);
        const to = nodeById.get(l.toId);
        return {
          id: l.id,
          x1: from?.x ?? 0, y1: from?.y ?? 0,
          x2: to?.x ?? 0, y2: to?.y ?? 0,
          description: l.description,
          valid: !!from && !!to,
        };
      }).filter((l) => l.valid);

      ctx!.lineWidth = CFG.linkWidth;
      for (const l of linkLines) {
        ctx!.strokeStyle = `rgba(180, 200, 210, ${CFG.linkOpacity})`;
        ctx!.beginPath();
        ctx!.moveTo(l.x1, l.y1);
        ctx!.lineTo(l.x2, l.y2);
        ctx!.stroke();
      }

      // Glow on project links
      ctx!.lineWidth = CFG.glowLinkWidth;
      for (const l of linkLines) {
        ctx!.strokeStyle = `rgba(160, 185, 200, ${CFG.glowLinkOpacity})`;
        ctx!.beginPath();
        ctx!.moveTo(l.x1, l.y1);
        ctx!.lineTo(l.x2, l.y2);
        ctx!.stroke();
      }

      // Link description labels
      ctx!.font = "9px 'Geist Mono', monospace";
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      for (const l of linkLines) {
        if (l.description) {
          const mx = (l.x1 + l.x2) / 2;
          const my = (l.y1 + l.y2) / 2;
          ctx!.fillStyle = "rgba(180, 200, 210, 0.4)";
          ctx!.fillText(l.description, mx, my - 8, 140);
        }
      }

      // 3. Draw project nodes
      for (const n of projectNodes) {
        const glow = getGlowSprite(n.color, n.radius);
        ctx!.drawImage(glow.canvas, n.x - glow.size, n.y - glow.size, glow.size * 2, glow.size * 2);

        ctx!.globalAlpha = 0.9;
        ctx!.fillStyle = n.color;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.globalAlpha = 1.0;

        // Progress ring (aggregate)
        if (n.progress > 0) {
          ctx!.strokeStyle = `rgba(140, 200, 160, 0.8)`;
          ctx!.lineWidth = 2.5;
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, n.radius + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * n.progress);
          ctx!.stroke();
        }
        const allItems = (n.project.workstreams || []).flatMap((ws) => ws.items || []);
        if (allItems.length > 0) {
          ctx!.strokeStyle = `rgba(140, 200, 160, 0.15)`;
          ctx!.lineWidth = 2.5;
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, n.radius + 4, 0, Math.PI * 2);
          ctx!.stroke();
        }

        // Name label
        ctx!.fillStyle = hoveredId === n.id ? "rgba(226, 232, 240, 1.0)" : "rgba(226, 232, 240, 0.7)";
        ctx!.font = "10px 'Geist Mono', monospace";
        ctx!.textAlign = "center";
        ctx!.textBaseline = "top";
        const maxWidth = 120;
        const words = n.name.split(" ");
        const lines: string[] = [];
        let currentLine = "";
        for (const word of words) {
          const testLine = currentLine ? currentLine + " " + word : word;
          if (ctx!.measureText(testLine).width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);
        const lineHeight = 13;
        for (let li = 0; li < lines.length; li++) {
          ctx!.fillText(lines[li], n.x, n.y + CFG.nameOffsetY + li * lineHeight);
        }
      }

      // 4. Draw workstream nodes
      for (const n of wsNodes) {
        const glow = getGlowSprite(n.color, n.radius);
        ctx!.drawImage(glow.canvas, n.x - glow.size, n.y - glow.size, glow.size * 2, glow.size * 2);

        ctx!.globalAlpha = 0.7;
        ctx!.fillStyle = n.color;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.globalAlpha = 1.0;

        // Mini progress ring
        if (n.progress > 0) {
          ctx!.strokeStyle = `rgba(140, 200, 160, 0.7)`;
          ctx!.lineWidth = 1.5;
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, n.radius + 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * n.progress);
          ctx!.stroke();
        }

        // Name label
        ctx!.fillStyle = hoveredId === n.id ? "rgba(226, 232, 240, 0.8)" : "rgba(226, 232, 240, 0.4)";
        ctx!.font = "8px 'Geist Mono', monospace";
        ctx!.textAlign = "center";
        ctx!.textBaseline = "top";
        const displayName = n.name.length > 16 ? n.name.slice(0, 15) + "…" : n.name;
        ctx!.fillText(displayName, n.x, n.y + CFG.wsNameOffsetY, 80);
      }

      // Empty state
      if (projectNodes.length === 0) {
        ctx!.fillStyle = "rgba(85, 85, 85, 0.6)";
        ctx!.font = "12px 'Geist Mono', monospace";
        ctx!.textAlign = "center";
        ctx!.textBaseline = "middle";
        ctx!.fillText("click + to create your first project", W / 2, H / 2);
      }
    }

    function loop(timestamp: number) {
      let dt = timestamp - lastTime;
      lastTime = timestamp;
      if (dt > 32) dt = 32;
      render(timestamp);
      rafId = requestAnimationFrame(loop);
    }

    function getCanvasCoords(e: MouseEvent): [number, number] {
      const rect = containerEl!.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    }

    function onMouseDown(e: MouseEvent) {
      const [mx, my] = getCanvasCoords(e);
      const allNodes = getScreenNodes(performance.now());
      const hit = hitTestNode(mx, my, allNodes, CFG.hitPadding);

      if (hit) {
        const node = allNodes.find((n) => n.id === hit.id) as ScreenNode | undefined;
        if (node?.type === "project") {
          dragId = hit.id;
          dragStartX = mx;
          dragStartY = my;
          dragMoved = false;
          setCursorClass("dragging-node");
        }
        // Workstream nodes are not draggable — click handled in mouseUp
      }
    }

    function onMouseMove(e: MouseEvent) {
      const [mx, my] = getCanvasCoords(e);

      if (dragId) {
        const dx = mx - dragStartX;
        const dy = my - dragStartY;
        if (Math.abs(dx) > CFG.dragThreshold || Math.abs(dy) > CFG.dragThreshold) {
          dragMoved = true;
        }
        if (dragMoved) {
          const norm = screenToNormalized(mx, my, W, H);
          const updated = projectsRef.current.map((p) =>
            p.id === dragId ? { ...p, posX: norm.x, posY: norm.y } : p
          );
          onUpdateProjects(updated);
        }
        return;
      }

      const allNodes = getScreenNodes(performance.now());
      const hitNode = hitTestNode(mx, my, allNodes, CFG.hitPadding);
      hoveredId = hitNode?.id ?? null;
      setCursorClass(hitNode ? "hovering-node" : "");
    }

    function onMouseUp(e: MouseEvent) {
      const [mx, my] = getCanvasCoords(e);

      if (dragId) {
        if (!dragMoved) {
          const project = projectsRef.current.find((p) => p.id === dragId);
          if (project) onSelectProject(project);
        } else {
          const norm = screenToNormalized(mx, my, W, H);
          fetch(`/api/projects/${dragId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ posX: norm.x, posY: norm.y }),
          });
        }
        dragId = null;
        setCursorClass("");
        return;
      }

      // Check for workstream node click
      const allNodes = getScreenNodes(performance.now());
      const hit = hitTestNode(mx, my, allNodes, CFG.hitPadding);
      if (hit) {
        const node = allNodes.find((n) => n.id === hit.id) as ScreenNode | undefined;
        if (node?.type === "workstream" && node.workstreamId) {
          onSelectWorkstream(node.project, node.workstreamId);
        }
      }
    }

    resize();
    rafId = requestAnimationFrame(loop);

    const el = canvasEl!;
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", resize);
    };
  }, [memberColor, links, onSelectProject, onSelectWorkstream, onUpdateProjects]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className={`project-graph-canvas absolute inset-0 ${cursorClass}`}
        style={{ display: "block" }}
      />
    </div>
  );
}
