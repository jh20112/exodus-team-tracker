"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { normalizedToScreen, screenToNormalized, hitTestNode, hitTestLine } from "@/lib/graphUtils";
import type { Project, ProjectLink } from "@/lib/types";

interface ProjectGraphProps {
  projects: Project[];
  memberColor: string;
  onSelectProject: (project: Project) => void;
  onUpdateProjects: (projects: Project[]) => void;
}

// Rendering config — mirrors NetworkBackground aesthetic but larger
const CFG = {
  nodeRadius: 16,
  hoverScale: 1.15,
  pulseAmp: 1.2,
  pulseSpeed: 0.6,
  linkOpacity: 0.2,
  linkWidth: 1,
  glowLinkWidth: 2.5,
  glowLinkOpacity: 0.08,
  hitPadding: 8,
  dragThreshold: 5,
  nameOffsetY: 28,
};

const COLORS = ["#5a7a84", "#846a78", "#6a8472", "#847a6a"];

interface ScreenNode {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  name: string;
  progress: number;
  project: Project;
}

export default function ProjectGraph({
  projects,
  memberColor,
  onSelectProject,
  onUpdateProjects,
}: ProjectGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef(projects);
  const [cursorClass, setCursorClass] = useState("");

  // Keep ref in sync
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  // Collect all links across projects
  const getLinks = useCallback((): ProjectLink[] => {
    const seen = new Set<string>();
    const links: ProjectLink[] = [];
    for (const p of projectsRef.current) {
      for (const l of [...(p.linksFrom || []), ...(p.linksTo || [])]) {
        if (!seen.has(l.id)) {
          seen.add(l.id);
          links.push(l);
        }
      }
    }
    return links;
  }, []);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    const containerEl = containerRef.current;
    if (!canvasEl || !containerEl) return;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0, dpr = 1;
    let rafId: number;
    let lastTime = 0;

    // Interaction state
    let mouseX = -9999, mouseY = -9999;
    let hoveredId: string | null = null;
    let hoveredLinkId: string | null = null;
    let dragId: string | null = null;
    let dragStartX = 0, dragStartY = 0;
    let dragMoved = false;
    let shiftHeld = false;
    let linkSourceId: string | null = null;
    let linkCursorX = 0, linkCursorY = 0;

    // Glow cache
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
      grad.addColorStop(0, color + "40");
      grad.addColorStop(0.35, color + "18");
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
      return projectsRef.current.map((p, i) => {
        const pos = normalizedToScreen(p.posX, p.posY, W, H);
        const pulse = 1 + Math.sin(t * 0.001 * CFG.pulseSpeed + i * 1.3) * 0.04;
        const totalItems = p.items?.length || 0;
        const completedItems = p.items?.filter((it) => it.completed).length || 0;
        const color = p.color || COLORS[i % COLORS.length];
        return {
          id: p.id,
          x: pos.x,
          y: pos.y,
          radius: CFG.nodeRadius * pulse * (hoveredId === p.id ? CFG.hoverScale : 1),
          color,
          name: p.name,
          progress: totalItems > 0 ? completedItems / totalItems : 0,
          project: p,
        };
      });
    }

    function render(t: number) {
      ctx!.clearRect(0, 0, W, H);
      const nodes = getScreenNodes(t);
      const links = getLinks();

      // Build link screen coords
      const linkLines = links.map((l) => {
        const from = nodes.find((n) => n.id === l.fromId);
        const to = nodes.find((n) => n.id === l.toId);
        return {
          id: l.id,
          x1: from?.x ?? 0, y1: from?.y ?? 0,
          x2: to?.x ?? 0, y2: to?.y ?? 0,
          fromColor: from?.color ?? memberColor,
        };
      }).filter((l) => {
        // Only render if both nodes exist
        return nodes.some((n) => n.x === l.x1 && n.y === l.y1) &&
               nodes.some((n) => n.x === l.x2 && n.y === l.y2);
      });

      // Draw connection lines
      for (const l of linkLines) {
        const isHovered = hoveredLinkId === l.id;
        ctx!.strokeStyle = `rgba(156, 184, 194, ${isHovered ? 0.4 : CFG.linkOpacity})`;
        ctx!.lineWidth = isHovered ? CFG.glowLinkWidth : CFG.linkWidth;
        ctx!.beginPath();
        ctx!.moveTo(l.x1, l.y1);
        ctx!.lineTo(l.x2, l.y2);
        ctx!.stroke();
      }

      // Glow on links
      ctx!.lineWidth = CFG.glowLinkWidth;
      for (const l of linkLines) {
        ctx!.strokeStyle = `rgba(123, 157, 181, ${CFG.glowLinkOpacity})`;
        ctx!.beginPath();
        ctx!.moveTo(l.x1, l.y1);
        ctx!.lineTo(l.x2, l.y2);
        ctx!.stroke();
      }

      // Draw linking line preview
      if (linkSourceId) {
        const src = nodes.find((n) => n.id === linkSourceId);
        if (src) {
          ctx!.strokeStyle = `rgba(156, 184, 194, 0.35)`;
          ctx!.lineWidth = 1.5;
          ctx!.setLineDash([6, 4]);
          ctx!.beginPath();
          ctx!.moveTo(src.x, src.y);
          ctx!.lineTo(linkCursorX, linkCursorY);
          ctx!.stroke();
          ctx!.setLineDash([]);
        }
      }

      // Draw nodes
      for (const n of nodes) {
        // Glow sprite
        const glow = getGlowSprite(n.color, n.radius);
        ctx!.drawImage(glow.canvas, n.x - glow.size, n.y - glow.size, glow.size * 2, glow.size * 2);

        // Solid circle
        ctx!.globalAlpha = 0.7;
        ctx!.fillStyle = n.color;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.globalAlpha = 1.0;

        // Progress ring
        if (n.progress > 0) {
          ctx!.strokeStyle = `rgba(123, 171, 138, 0.7)`;
          ctx!.lineWidth = 2.5;
          ctx!.beginPath();
          ctx!.arc(
            n.x, n.y,
            n.radius + 4,
            -Math.PI / 2,
            -Math.PI / 2 + Math.PI * 2 * n.progress
          );
          ctx!.stroke();
        }

        // Background ring track
        if (n.project.items && n.project.items.length > 0) {
          ctx!.strokeStyle = `rgba(123, 171, 138, 0.12)`;
          ctx!.lineWidth = 2.5;
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, n.radius + 4, 0, Math.PI * 2);
          ctx!.stroke();
        }

        // Name label (word-wrapped)
        ctx!.fillStyle = hoveredId === n.id ? "rgba(226, 232, 240, 0.9)" : "rgba(226, 232, 240, 0.5)";
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

      // Empty state
      if (nodes.length === 0) {
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

    // --- Mouse handlers ---
    function getCanvasCoords(e: MouseEvent): [number, number] {
      const rect = containerEl!.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    }

    function onMouseDown(e: MouseEvent) {
      const [mx, my] = getCanvasCoords(e);
      const nodes = getScreenNodes(performance.now());
      const hit = hitTestNode(mx, my, nodes, CFG.hitPadding);

      if (hit) {
        if (e.shiftKey) {
          // Start linking
          linkSourceId = hit.id;
          linkCursorX = mx;
          linkCursorY = my;
          setCursorClass("linking-node");
        } else {
          // Start potential drag
          dragId = hit.id;
          dragStartX = mx;
          dragStartY = my;
          dragMoved = false;
          setCursorClass("dragging-node");
        }
      }
    }

    function onMouseMove(e: MouseEvent) {
      const [mx, my] = getCanvasCoords(e);
      mouseX = mx;
      mouseY = my;

      if (linkSourceId) {
        linkCursorX = mx;
        linkCursorY = my;
        return;
      }

      if (dragId) {
        const dx = mx - dragStartX;
        const dy = my - dragStartY;
        if (Math.abs(dx) > CFG.dragThreshold || Math.abs(dy) > CFG.dragThreshold) {
          dragMoved = true;
        }
        if (dragMoved) {
          // Update position optimistically
          const norm = screenToNormalized(mx, my, W, H);
          const updated = projectsRef.current.map((p) =>
            p.id === dragId ? { ...p, posX: norm.x, posY: norm.y } : p
          );
          onUpdateProjects(updated);
        }
        return;
      }

      // Hover detection
      const nodes = getScreenNodes(performance.now());
      const hitNode = hitTestNode(mx, my, nodes, CFG.hitPadding);
      const links = getLinks();
      const linkLines = links.map((l) => {
        const from = nodes.find((n) => n.id === l.fromId);
        const to = nodes.find((n) => n.id === l.toId);
        return { id: l.id, x1: from?.x ?? 0, y1: from?.y ?? 0, x2: to?.x ?? 0, y2: to?.y ?? 0 };
      });
      const hitLink = !hitNode ? hitTestLine(mx, my, linkLines) : null;

      hoveredId = hitNode?.id ?? null;
      hoveredLinkId = hitLink?.id ?? null;

      if (hitNode) setCursorClass("hovering-node");
      else if (hitLink) setCursorClass("hovering-node");
      else setCursorClass("");
    }

    async function onMouseUp(e: MouseEvent) {
      const [mx, my] = getCanvasCoords(e);

      if (linkSourceId) {
        // Check if dropped on a target node
        const nodes = getScreenNodes(performance.now());
        const target = hitTestNode(mx, my, nodes, CFG.hitPadding);
        if (target && target.id !== linkSourceId) {
          // Create link
          const res = await fetch("/api/projects/links", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fromId: linkSourceId, toId: target.id }),
          });
          if (res.ok) {
            // Re-fetch to get updated links
            const memberId = projectsRef.current[0]?.memberId;
            if (memberId) {
              const projRes = await fetch(`/api/projects?memberId=${memberId}`);
              if (projRes.ok) onUpdateProjects(await projRes.json());
            }
          }
        }
        linkSourceId = null;
        setCursorClass("");
        return;
      }

      if (dragId) {
        if (!dragMoved) {
          // It was a click, not a drag — open detail panel
          const project = projectsRef.current.find((p) => p.id === dragId);
          if (project) onSelectProject(project);
        } else {
          // Persist new position
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

      // Click on link to delete
      const nodes = getScreenNodes(performance.now());
      const hitNode = hitTestNode(mx, my, nodes, CFG.hitPadding);
      if (!hitNode && hoveredLinkId) {
        await fetch("/api/projects/links", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: hoveredLinkId }),
        });
        const memberId = projectsRef.current[0]?.memberId;
        if (memberId) {
          const projRes = await fetch(`/api/projects?memberId=${memberId}`);
          if (projRes.ok) onUpdateProjects(await projRes.json());
        }
        hoveredLinkId = null;
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Shift") shiftHeld = true;
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "Shift") shiftHeld = false;
    }

    resize();
    rafId = requestAnimationFrame(loop);

    const el = canvasEl!;
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", resize);
    };
  }, [memberColor, getLinks, onSelectProject, onUpdateProjects]);

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
