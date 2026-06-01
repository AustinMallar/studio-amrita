import type { BearId } from "@/lib/game/types";

export const KIRBY = {
  skyTop: "#60c8f0",
  skyBottom: "#90e0f8",
  grassTop: "#5cb838",
  grassMid: "#48a828",
  grassDark: "#389018",
  grassTuft: "#68cc44",
  trunk: "#a06828",
  trunkDark: "#704818",
  trunkKnot: "#503010",
  canopyDark: "#3a9820",
  canopyMid: "#58b830",
  canopyLight: "#80d050",
  hudBg: "#1a1208",
  hudBorder: "#c89840",
  hudText: "#ffffff",
  outline: "#281808",
} as const;

export const PLAYER_LANE_COLORS: Record<BearId, string> = {
  matcha: "#58c040",
  sakura: "#f04858",
  honey: "#f0a020",
  cloud: "#60b0e8",
};

export function drawKirbySky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, KIRBY.skyTop);
  grad.addColorStop(1, KIRBY.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

export function drawKirbyGround(
  ctx: CanvasRenderingContext2D,
  w: number,
  playH: number,
  groundY: number,
): void {
  const grad = ctx.createLinearGradient(0, groundY, 0, playH);
  grad.addColorStop(0, KIRBY.grassTop);
  grad.addColorStop(0.5, KIRBY.grassMid);
  grad.addColorStop(1, KIRBY.grassDark);
  ctx.fillStyle = grad;
  ctx.fillRect(0, groundY, w, playH - groundY);

  // Ground edge line
  ctx.strokeStyle = KIRBY.grassDark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 1);
  ctx.lineTo(w, groundY + 1);
  ctx.stroke();

  // Grass tufts
  ctx.fillStyle = KIRBY.grassTuft;
  for (let x = 10; x < w; x += 22) {
    const h2 = 5 + (x % 44) * 0.06;
    ctx.beginPath();
    ctx.moveTo(x - 3, groundY);
    ctx.lineTo(x, groundY - h2);
    ctx.lineTo(x + 3, groundY);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Draw 4 individual Kirby-style round trees.
 *
 * Each tree is a circle (R ≈ 65% of lane width) drawn in layered passes so
 * overlapping fills merge naturally:
 *   Pass 1 – all shadows   (no outlines yet)
 *   Pass 2 – dark border   (circle at R+3 in canopyDark, gives outer edge)
 *   Pass 3 – main fill     (circle at R in canopyMid, covers inner border area)
 *   Pass 4 – highlight     (small ellipse clipped to each canopy)
 *   Pass 5 – trunks        (short rectangles below canopy bottom)
 *
 * With the shorter canvas (width * 0.55) and higher groundY (65% of playH), the
 * ratio of treeH:laneWidth is now ~1.3:1, letting R = 0.65 * laneWidth produce
 * a nearly circular canopy that fills the vertical space naturally.
 */
export function drawKirbyForest(
  ctx: CanvasRenderingContext2D,
  _w: number,
  groundY: number,
  playTop: number,
  laneX: number[],
  laneWidth: number,
  shakeAmt: number,
): void {
  // Circle radius: large enough to fill the height, small enough to keep shape round
  const R = laneWidth * 0.65;
  // Center y: circle starts at playTop (top of canvas)
  const cy = playTop + R;
  const canopyBottom = cy + R;

  const trunkW = Math.max(16, laneWidth * 0.18);
  const trunkH = Math.max(8, groundY - canopyBottom);
  const trunkTop = canopyBottom;

  // ── Pass 1: Drop shadows ───────────────────────────────────────────────────
  ctx.fillStyle = KIRBY.canopyDark;
  for (const lx of laneX) {
    ctx.beginPath();
    ctx.arc(lx + 5, cy + 7, R, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Pass 2: Dark-border circles (gives natural outline on exposed edges) ───
  ctx.fillStyle = KIRBY.canopyDark;
  for (const lx of laneX) {
    ctx.beginPath();
    ctx.arc(lx, cy, R + 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Pass 3: Main canopy fills (covers the inner part of the border) ────────
  ctx.fillStyle = KIRBY.canopyMid;
  for (const lx of laneX) {
    ctx.beginPath();
    ctx.arc(lx, cy, R, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Pass 4: Per-tree highlight (small glint at upper-left, clipped) ────────
  for (const lx of laneX) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(lx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = KIRBY.canopyLight;
    ctx.beginPath();
    ctx.ellipse(lx - R * 0.3, cy - R * 0.3, R * 0.32, R * 0.22, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ── Pass 5: Trunks ─────────────────────────────────────────────────────────
  for (let i = 0; i < laneX.length; i++) {
    if (trunkH <= 0) continue;
    const shake = (i % 2 === 0 ? 1 : -0.7) * shakeAmt;
    const tx = (laneX[i] ?? 0) + shake;

    ctx.fillStyle = KIRBY.trunk;
    ctx.strokeStyle = KIRBY.outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(tx - trunkW / 2, trunkTop, trunkW, trunkH, [0, 0, 4, 4]);
    ctx.fill();
    ctx.stroke();

    // Knot marks along the trunk
    for (const kp of [0.28, 0.65] as const) {
      ctx.fillStyle = KIRBY.trunkKnot;
      ctx.beginPath();
      ctx.arc(tx - trunkW * 0.1, trunkTop + kp * trunkH, Math.max(2, trunkH * 0.07), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawKirbyTree(
  ctx: CanvasRenderingContext2D,
  tx: number,
  groundY: number,
  playTop: number,
  laneWidth: number,
  shakeX: number,
): void {
  const x = tx + shakeX;
  const treeRegionH = groundY - playTop;

  // n bumps + straight walls prevent sky showing through V-notch gaps
  const n = 4;
  // R chosen so canopy fills ~78% of tree height:
  // canopyBottom = playTop + R + wallH + bumpR = playTop + R + 2*(R/n)
  // = playTop + R*(1 + 2/n) → for n=4: playTop + 1.5*R
  // We want 1.5*R = treeRegionH*0.78 → R = treeRegionH*0.52
  const R = Math.max(laneWidth * 0.62, treeRegionH * 0.52);
  const cy = playTop + R;
  const bumpR = R / n;
  const wallH = bumpR; // straight side walls = same height as bumps
  const canopyBottom = cy + wallH + bumpR;

  const trunkTop = canopyBottom - 4;
  const trunkH = groundY - trunkTop;
  const trunkW = Math.max(18, laneWidth * 0.17);

  // ── Shadow ───────────────────────────────────────────────────────────────
  ctx.fillStyle = KIRBY.canopyDark;
  traceWaisted(ctx, x, cy + 7, R, wallH, bumpR, n);
  ctx.fill();

  // ── Main canopy ──────────────────────────────────────────────────────────
  ctx.fillStyle = KIRBY.canopyMid;
  traceWaisted(ctx, x, cy, R, wallH, bumpR, n);
  ctx.fill();

  // ── Highlight (clipped) ──────────────────────────────────────────────────
  ctx.save();
  traceWaisted(ctx, x, cy, R, wallH, bumpR, n);
  ctx.clip();
  ctx.fillStyle = KIRBY.canopyLight;
  ctx.beginPath();
  ctx.ellipse(x - R * 0.28, cy - R * 0.25, R * 0.44, R * 0.36, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Outline (dark green so overlapping trees blend smoothly) ─────────────
  ctx.strokeStyle = KIRBY.canopyDark;
  ctx.lineWidth = 2.5;
  traceWaisted(ctx, x, cy, R, wallH, bumpR, n);
  ctx.stroke();

  // ── Trunk ────────────────────────────────────────────────────────────────
  ctx.fillStyle = KIRBY.trunk;
  ctx.strokeStyle = KIRBY.outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - trunkW / 2, trunkTop, trunkW, trunkH, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = KIRBY.trunkDark;
  ctx.beginPath();
  ctx.roundRect(x - trunkW / 2 + 3, groundY - 12, trunkW - 6, 9, 3);
  ctx.fill();

  for (const kp of [0.2, 0.5, 0.75] as const) {
    ctx.fillStyle = KIRBY.trunkKnot;
    ctx.beginPath();
    ctx.arc(x - trunkW * 0.1, trunkTop + kp * trunkH, treeRegionH * 0.016, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Trace the "waisted canopy" path:
 *
 *   smooth arc over the top
 *   │                │   ← straight walls of height wallH (fills V-notch gaps)
 *   ∪ ∪ ∪ ∪         ← n downward bumps of radius bumpR
 *
 * The walls are critical — without them, sky shows through the gaps between
 * adjacent scallop bumps, creating unwanted arch/cathedral effects.
 */
function traceWaisted(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  wallH: number,
  bumpR: number,
  n: number,
): void {
  ctx.beginPath();
  // Top smooth arc: CCW from (cx+R, cy) → over the top → to (cx-R, cy)
  ctx.arc(cx, cy, R, 0, Math.PI, true);
  // Left wall: straight line DOWN from (cx-R, cy) to (cx-R, cy+wallH)
  ctx.lineTo(cx - R, cy + wallH);
  // Bottom bumps: n downward arcs from left to right at y = cy+wallH
  for (let i = 0; i < n; i++) {
    const bx = cx - R + (2 * i + 1) * bumpR;
    ctx.arc(bx, cy + wallH, bumpR, Math.PI, 0, false);
  }
  // Right wall: straight line UP from (cx+R, cy+wallH) to (cx+R, cy)
  ctx.lineTo(cx + R, cy);
  ctx.closePath();
}

export function drawKirbyBushes(
  ctx: CanvasRenderingContext2D,
  w: number,
  groundY: number,
): void {
  ctx.fillStyle = "#2a7818";
  ctx.beginPath();
  ctx.moveTo(0, groundY + 2);
  for (let x = 0; x <= w; x += 36) {
    const bh = 8 + (x % 72) * 0.06;
    ctx.lineTo(x, groundY - bh);
  }
  ctx.lineTo(w, groundY + 2);
  ctx.closePath();
  ctx.fill();
}

export function drawKirbyScoreHud(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  hudH: number,
  bears: Array<{ id: BearId; x: number; score: number; isPlayer: boolean }>,
): void {
  // HUD background
  ctx.fillStyle = KIRBY.hudBg;
  ctx.fillRect(0, h - hudH, w, hudH);
  ctx.strokeStyle = KIRBY.hudBorder;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, h - hudH);
  ctx.lineTo(w, h - hudH);
  ctx.stroke();

  const boxW = Math.min(80, Math.floor((w - 32) / bears.length));
  const boxH = hudH - 10;
  const totalW = bears.length * boxW + (bears.length - 1) * 6;
  let bx = (w - totalW) / 2;

  for (const bear of bears) {
    const by = h - hudH + 5;

    // Box background
    ctx.fillStyle = "#2a200e";
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 4);
    ctx.fill();
    ctx.strokeStyle = KIRBY.hudBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Colour swatch
    const sw = 13;
    ctx.fillStyle = PLAYER_LANE_COLORS[bear.id];
    ctx.beginPath();
    ctx.roundRect(bx + 5, by + (boxH - sw) / 2, sw, sw, 2);
    ctx.fill();

    // Label
    ctx.fillStyle = KIRBY.hudText;
    ctx.font = `bold ${Math.max(8, boxH * 0.38)}px monospace`;
    ctx.textAlign = "left";
    const label = bear.isPlayer ? "YOU" : bear.id.slice(0, 3).toUpperCase();
    ctx.fillText(label, bx + sw + 9, by + boxH * 0.54);

    // Score
    ctx.font = `bold ${Math.max(12, boxH * 0.55)}px monospace`;
    ctx.textAlign = "right";
    ctx.fillText(String(bear.score).padStart(2, "0"), bx + boxW - 5, by + boxH - 5);

    bx += boxW + 6;
  }
}

export function drawKirbyStrawberry(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  const r = size / 2;
  // Leaf crown
  ctx.fillStyle = "#70b060";
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(x + i * r * 0.22, y - r * 0.6, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#88c878";
  ctx.beginPath();
  ctx.ellipse(x, y - r * 0.4, r * 0.55, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body
  ctx.fillStyle = "#c8889a";
  ctx.beginPath();
  ctx.ellipse(x + 1, y + 1, r * 0.85, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e8b0bc";
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.85, r, 0, 0, Math.PI * 2);
  ctx.fill();
  // Crochet rows
  ctx.strokeStyle = "#c8889a";
  ctx.lineWidth = 0.9;
  for (let row = -1; row <= 1; row++) {
    ctx.beginPath();
    ctx.ellipse(x, y + row * r * 0.3, r * 0.7, r * 0.09, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Highlight
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.beginPath();
  ctx.ellipse(x - r * 0.28, y - r * 0.28, r * 0.3, r * 0.2, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawKirbyBomb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  now: number,
): void {
  const r = size / 2;
  // Dark yarn ball
  ctx.fillStyle = "#2a2030";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  // Yarn texture rows
  ctx.strokeStyle = "#3e3050";
  ctx.lineWidth = 1.4;
  for (let row = -1; row <= 1; row++) {
    ctx.beginPath();
    ctx.ellipse(x, y + row * r * 0.3, r * 0.72, r * 0.1, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Highlight
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.ellipse(x - r * 0.28, y - r * 0.28, r * 0.3, r * 0.2, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // Fuse cord
  ctx.strokeStyle = "#c87040";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + r * 0.42, y - r * 1.42, x + r * 0.22, y - r * 1.72);
  ctx.stroke();
  // Spark (animated)
  const flicker = Math.sin(now * 0.02) * 0.5 + 0.5;
  ctx.fillStyle = `rgba(255,${160 + Math.round(flicker * 80)},40,${0.85 + flicker * 0.15})`;
  ctx.beginPath();
  ctx.arc(x + r * 0.22, y - r * 1.72, r * 0.28 + flicker * r * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

export function drawKirbyBasket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  _score: number,
): void {
  // Peach crochet basket
  ctx.fillStyle = "#d4a882";
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h, w, h, 3);
  ctx.fill();
  // Crochet rows
  ctx.strokeStyle = "#b8845e";
  ctx.lineWidth = 1;
  for (let row = 1; row <= 2; row++) {
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 2, y - h + (row * h) / 3);
    ctx.lineTo(x + w / 2 - 2, y - h + (row * h) / 3);
    ctx.stroke();
  }
  // Top rim
  ctx.fillStyle = "#e0b896";
  ctx.beginPath();
  ctx.roundRect(x - w / 2 - 2, y - h - 3, w + 4, 6, 2);
  ctx.fill();
  // Outline
  ctx.strokeStyle = "#804820";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h, w, h, 3);
  ctx.stroke();
}

export function drawArcadeFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  ctx.strokeStyle = KIRBY.hudBorder;
  ctx.lineWidth = 5;
  ctx.strokeRect(2.5, 2.5, w - 5, h - 5);
  ctx.strokeStyle = "#7a5820";
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, w - 12, h - 12);
}
