"use client";

import { useRef, useEffect } from "react";

const CFG = {
  nodeCount: 45,
  minR: 1.5,
  maxR: 4.5,
  linkDist: 160,
  linkOpacityCap: 0.12,
  linkWidth: 0.5,
  repulseDist: 60,
  repulseForce: 0.8,
  mouseRadius: 200,
  mouseForce: 0.015,
  damping: 0.98,
  driftSpeed: 0.3,
  pulseAmp: 0.4,
  pulseSpeed: 0.8,
  gridCell: 160,
  pingIntervalMin: 3000,
  pingIntervalMax: 5000,
  pingDuration: 1200,
  pingMaxRadius: 60,
  glowTopN: 8,
};

const COLORS = ["#5a7a84", "#846a78", "#6a8472", "#847a6a"];
const ACCENTS = ["#4a6a7a", "#4a7a5a", "#7a6a4a", "#7a4a5a"];

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  baseR: number;
  color: string;
  accent: string;
  driftAngle: number;
  driftPhase: number;
  pulsePhase: number;
}

interface Ping {
  x: number;
  y: number;
  color: string;
  born: number;
  duration: number;
}

interface Link {
  a: Node;
  b: Node;
  dist: number;
  alpha: number;
}

class SpatialHash {
  cell: number;
  map: Map<string, Node[]>;

  constructor(cellSize: number) {
    this.cell = cellSize;
    this.map = new Map();
  }

  clear() {
    this.map.clear();
  }

  key(x: number, y: number) {
    return ((x / this.cell) | 0) + "," + ((y / this.cell) | 0);
  }

  insert(node: Node) {
    const k = this.key(node.x, node.y);
    let bucket = this.map.get(k);
    if (!bucket) {
      bucket = [];
      this.map.set(k, bucket);
    }
    bucket.push(node);
  }

  query(x: number, y: number): Node[] {
    const cx = (x / this.cell) | 0;
    const cy = (y / this.cell) | 0;
    const result: Node[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = this.map.get(cx + dx + "," + (cy + dy));
        if (bucket) for (let i = 0; i < bucket.length; i++) result.push(bucket[i]);
      }
    }
    return result;
  }
}

export default function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W: number, H: number, dpr: number;
    const mouse = { x: -9999, y: -9999 };
    const grid = new SpatialHash(CFG.gridCell);
    const glowCache = new Map<string, { canvas: HTMLCanvasElement; size: number }>();
    const nodes: Node[] = [];
    const pings: Ping[] = [];
    let nextPing = 0;
    let rafId: number;
    let lastTime = 0;

    function getGlowSprite(color: string, radius: number) {
      const key = color + "|" + radius;
      if (glowCache.has(key)) return glowCache.get(key)!;
      const size = Math.ceil(radius * 8);
      const oc = document.createElement("canvas");
      oc.width = size * 2;
      oc.height = size * 2;
      const octx = oc.getContext("2d")!;
      const grad = octx.createRadialGradient(size, size, 0, size, size, size);
      grad.addColorStop(0, color + "30");
      grad.addColorStop(0.4, color + "12");
      grad.addColorStop(1, color + "00");
      octx.fillStyle = grad;
      octx.fillRect(0, 0, size * 2, size * 2);
      const entry = { canvas: oc, size };
      glowCache.set(key, entry);
      return entry;
    }

    function resize() {
      dpr = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initNodes() {
      nodes.length = 0;
      for (let i = 0; i < CFG.nodeCount; i++) {
        const r = CFG.minR + Math.random() * (CFG.maxR - CFG.minR);
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: 0,
          vy: 0,
          r,
          baseR: r,
          color: COLORS[i % COLORS.length],
          accent: ACCENTS[i % ACCENTS.length],
          driftAngle: Math.random() * Math.PI * 2,
          driftPhase: Math.random() * Math.PI * 2,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    }

    function schedulePing(t: number) {
      nextPing = t + CFG.pingIntervalMin + Math.random() * (CFG.pingIntervalMax - CFG.pingIntervalMin);
    }

    function spawnPing(t: number) {
      const node = nodes[(Math.random() * nodes.length) | 0];
      pings.push({
        x: node.x,
        y: node.y,
        color: node.accent,
        born: t,
        duration: CFG.pingDuration,
      });
      schedulePing(t);
    }

    function update(dt: number, t: number) {
      grid.clear();
      for (let i = 0; i < nodes.length; i++) grid.insert(nodes[i]);

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        n.driftAngle += Math.sin(t * 0.0005 + n.driftPhase) * 0.02;
        n.vx += Math.cos(n.driftAngle) * CFG.driftSpeed * dt * 0.01;
        n.vy += Math.sin(n.driftAngle) * CFG.driftSpeed * dt * 0.01;

        n.r = n.baseR + Math.sin(t * 0.001 * CFG.pulseSpeed + n.pulsePhase) * CFG.pulseAmp;

        const mdx = mouse.x - n.x;
        const mdy = mouse.y - n.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < CFG.mouseRadius && mdist > 1) {
          const force = CFG.mouseForce * (1 - mdist / CFG.mouseRadius);
          n.vx += (mdx / mdist) * force * dt;
          n.vy += (mdy / mdist) * force * dt;
        }

        const nearby = grid.query(n.x, n.y);
        for (let j = 0; j < nearby.length; j++) {
          const m = nearby[j];
          if (m === n) continue;
          const dx = n.x - m.x;
          const dy = n.y - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CFG.repulseDist && dist > 0.1) {
            const force = CFG.repulseForce * (1 - dist / CFG.repulseDist);
            n.vx += (dx / dist) * force * dt * 0.01;
            n.vy += (dy / dist) * force * dt * 0.01;
          }
        }

        n.vx *= CFG.damping;
        n.vy *= CFG.damping;
        n.x += n.vx * dt * 0.06;
        n.y += n.vy * dt * 0.06;

        if (n.x < -20) n.x += W + 40;
        if (n.x > W + 20) n.x -= W + 40;
        if (n.y < -20) n.y += H + 40;
        if (n.y > H + 20) n.y -= H + 40;
      }

      if (t >= nextPing) spawnPing(t);
      for (let i = pings.length - 1; i >= 0; i--) {
        if (t - pings[i].born > pings[i].duration) pings.splice(i, 1);
      }
    }

    function render(t: number) {
      ctx.clearRect(0, 0, W, H);

      const links: Link[] = [];
      const seen = new Set<string>();
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const nearby = grid.query(n.x, n.y);
        for (let j = 0; j < nearby.length; j++) {
          const m = nearby[j];
          if (m === n) continue;
          const ni = nodes.indexOf(n);
          const mi = nodes.indexOf(m);
          const id = ni < mi ? ni + "|" + mi : mi + "|" + ni;
          if (seen.has(id)) continue;
          const dx = n.x - m.x;
          const dy = n.y - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CFG.linkDist) {
            const rawAlpha = Math.pow(1 - dist / CFG.linkDist, 2) * CFG.linkOpacityCap;
            const shimmer = 1 + 0.15 * Math.sin(t * 0.002 + n.pulsePhase + m.pulsePhase);
            const alpha = Math.min(rawAlpha * shimmer, CFG.linkOpacityCap);
            links.push({ a: n, b: m, dist, alpha });
            seen.add(id);
          }
        }
      }

      links.sort((a, b) => a.dist - b.dist);

      ctx.lineWidth = CFG.linkWidth;
      for (let i = 0; i < links.length; i++) {
        const l = links[i];
        ctx.strokeStyle = `rgba(156, 184, 194, ${l.alpha})`;
        ctx.beginPath();
        ctx.moveTo(l.a.x, l.a.y);
        ctx.lineTo(l.b.x, l.b.y);
        ctx.stroke();
      }

      const glowCount = Math.min(CFG.glowTopN, links.length);
      ctx.lineWidth = 2;
      for (let i = 0; i < glowCount; i++) {
        const l = links[i];
        ctx.strokeStyle = `rgba(123, 157, 181, ${l.alpha * 0.25})`;
        ctx.beginPath();
        ctx.moveTo(l.a.x, l.a.y);
        ctx.lineTo(l.b.x, l.b.y);
        ctx.stroke();
      }
      ctx.lineWidth = CFG.linkWidth;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const glow = getGlowSprite(n.color, n.baseR);
        ctx.drawImage(glow.canvas, n.x - glow.size, n.y - glow.size, glow.size * 2, glow.size * 2);
      }

      ctx.globalAlpha = 0.6;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, Math.max(n.r, 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      for (let i = 0; i < pings.length; i++) {
        const p = pings[i];
        const progress = (t - p.born) / p.duration;
        const radius = progress * CFG.pingMaxRadius;
        const alpha = (1 - progress) * 0.18;
        ctx.strokeStyle = p.color + Math.round(alpha * 255).toString(16).padStart(2, "0");
        ctx.lineWidth = 1.5 * (1 - progress);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.lineWidth = CFG.linkWidth;
    }

    function loop(timestamp: number) {
      let dt = timestamp - lastTime;
      lastTime = timestamp;
      if (dt > 32) dt = 32;

      update(dt, timestamp);
      render(timestamp);
      rafId = requestAnimationFrame(loop);
    }

    function onMouse(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
    function onTouch(e: TouchEvent) {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    }
    function onTouchEnd() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    window.addEventListener("mousemove", onMouse);
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("resize", resize);

    resize();
    initNodes();
    schedulePing(0);
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{ display: "block" }}
    />
  );
}
