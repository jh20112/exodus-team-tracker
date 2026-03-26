export function normalizedToScreen(nx: number, ny: number, w: number, h: number) {
  return { x: nx * w, y: ny * h };
}

export function screenToNormalized(sx: number, sy: number, w: number, h: number) {
  return { x: Math.max(0.05, Math.min(0.95, sx / w)), y: Math.max(0.05, Math.min(0.95, sy / h)) };
}

export interface GraphNode {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export function hitTestNode(
  mx: number,
  my: number,
  nodes: GraphNode[],
  threshold: number = 0
): GraphNode | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    const dx = mx - n.x;
    const dy = my - n.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= n.radius + threshold) return n;
  }
  return null;
}

export function hitTestLine(
  mx: number,
  my: number,
  lines: { id: string; x1: number; y1: number; x2: number; y2: number }[],
  threshold: number = 6
): { id: string } | null {
  for (const line of lines) {
    const dx = line.x2 - line.x1;
    const dy = line.y2 - line.y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) continue;

    let t = ((mx - line.x1) * dx + (my - line.y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const closestX = line.x1 + t * dx;
    const closestY = line.y1 + t * dy;
    const distSq = (mx - closestX) ** 2 + (my - closestY) ** 2;

    if (distSq <= threshold * threshold) return { id: line.id };
  }
  return null;
}
