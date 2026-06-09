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
  matcha: "#BDCAB7",
  sakura: "#E6B9BC",
  honey: "#AA9183",
  cloud: "#CAC8C4",
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

type CanopyLobe = { dx: number; dy: number; r: number };

/** Trace the union of all canopy lobes as a single fillable path. */
function traceCanopy(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  lobes: CanopyLobe[],
  inflate = 0,
): void {
  ctx.beginPath();
  for (const lobe of lobes) {
    const lx = cx + lobe.dx;
    const ly = cy + lobe.dy;
    ctx.moveTo(lx + lobe.r + inflate, ly);
    ctx.arc(lx, ly, lobe.r + inflate, 0, Math.PI * 2);
  }
}

/** Berry positions within a canopy, relative to the canopy center (× R). */
const BERRY_SPOTS: ReadonlyArray<readonly [number, number]> = [
  [-0.72, 0.18],
  [-0.25, -0.55],
  [0.34, -0.28],
  [0.78, 0.3],
  [0.05, 0.52],
  [-0.42, 0.62],
];

/**
 * Draw one Kirby-style berry tree per lane.
 *
 * Each tree:
 *   - tapered trunk with flared roots (drawn first, behind the canopy)
 *   - fluffy canopy built from 5 overlapping circle lobes, drawn in passes:
 *     drop shadow → dark rim → main fill → bottom shading → highlight → berries
 *   - per-tree size/height variation so the row reads as a forest, not a wall
 *
 * `shakeAmt` sways the canopies (not the trunks) — berries fall from the
 * leaves, so that's what should be shaking.
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
  const treeH = groundY - playTop;
  const sizeVariants = [1, 0.88, 1.05, 0.92] as const;

  for (let i = 0; i < laneX.length; i++) {
    const cx = laneX[i] ?? 0;
    const v = sizeVariants[i % sizeVariants.length];
    const R = Math.min(laneWidth * 0.48, treeH * 0.34) * v;
    const cy = playTop + R * 1.18 + (i % 2) * treeH * 0.03;
    const sway = shakeAmt * (i % 2 === 0 ? 1 : -0.8);

    const lobes: CanopyLobe[] = [
      { dx: 0, dy: -R * 0.35, r: R * 0.8 },
      { dx: -R * 0.58, dy: R * 0.1, r: R * 0.68 },
      { dx: R * 0.58, dy: R * 0.1, r: R * 0.68 },
      { dx: -R * 0.28, dy: R * 0.45, r: R * 0.6 },
      { dx: R * 0.28, dy: R * 0.45, r: R * 0.6 },
    ];
    const canopyBottom = cy + R * 1.05;

    // ── Trunk (behind canopy) ──────────────────────────────────────────────
    const tw = Math.max(8, laneWidth * 0.08) * v;
    const trunkTop = canopyBottom - R * 0.45;
    const trunkBottom = groundY + 4;
    const midY = trunkTop + (trunkBottom - trunkTop) * 0.45;

    ctx.fillStyle = KIRBY.trunk;
    ctx.strokeStyle = KIRBY.outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - tw * 0.85, trunkTop);
    ctx.bezierCurveTo(cx - tw * 0.95, midY, cx - tw, trunkBottom - 14, cx - tw * 1.6, trunkBottom);
    ctx.lineTo(cx + tw * 1.6, trunkBottom);
    ctx.bezierCurveTo(cx + tw, trunkBottom - 14, cx + tw * 0.95, midY, cx + tw * 0.85, trunkTop);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bark shading along the right edge + knot
    ctx.fillStyle = KIRBY.trunkDark;
    ctx.beginPath();
    ctx.moveTo(cx + tw * 0.35, trunkTop);
    ctx.bezierCurveTo(cx + tw * 0.45, midY, cx + tw * 0.5, trunkBottom - 14, cx + tw * 1.1, trunkBottom);
    ctx.lineTo(cx + tw * 1.6, trunkBottom);
    ctx.bezierCurveTo(cx + tw, trunkBottom - 14, cx + tw * 0.95, midY, cx + tw * 0.85, trunkTop);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = KIRBY.trunkKnot;
    ctx.beginPath();
    ctx.ellipse(cx - tw * 0.25, midY, tw * 0.22, tw * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Canopy (swaying) ───────────────────────────────────────────────────
    const sx = cx + sway;

    // Drop shadow, offset to bottom-right
    ctx.fillStyle = KIRBY.canopyDark;
    traceCanopy(ctx, sx + 4, cy + 6, lobes, 2);
    ctx.fill();

    // Dark rim (acts as a soft outline on all exposed edges)
    traceCanopy(ctx, sx, cy, lobes, 3);
    ctx.fill();

    // Main fill
    ctx.fillStyle = KIRBY.canopyMid;
    traceCanopy(ctx, sx, cy, lobes);
    ctx.fill();

    // Bottom shading + top highlight, clipped to the canopy
    ctx.save();
    traceCanopy(ctx, sx, cy, lobes);
    ctx.clip();

    ctx.globalAlpha = 0.4;
    ctx.fillStyle = KIRBY.canopyDark;
    ctx.beginPath();
    ctx.ellipse(sx, cy + R * 0.85, R * 1.45, R * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = KIRBY.canopyLight;
    ctx.beginPath();
    ctx.ellipse(sx - R * 0.35, cy - R * 0.55, R * 0.52, R * 0.34, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + R * 0.42, cy - R * 0.62, R * 0.14, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Berries dotted through the leaves
    const berryR = Math.max(3, R * 0.08);
    for (let b = 0; b < BERRY_SPOTS.length; b++) {
      // Skip one spot per tree so berry patterns differ between trees
      if (b === i % BERRY_SPOTS.length) continue;
      const [bdx, bdy] = BERRY_SPOTS[b];
      const bx = sx + bdx * R;
      const by = cy + bdy * R;

      ctx.fillStyle = "#b03048";
      ctx.beginPath();
      ctx.arc(bx, by, berryR + 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e05a6e";
      ctx.beginPath();
      ctx.arc(bx, by, berryR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.arc(bx - berryR * 0.3, by - berryR * 0.3, berryR * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Cartoon impact burst shown where two bears collide. t goes 0 → 1. */
export function drawKirbyBumpStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
): void {
  const fade = 1 - t;
  const r = 8 + t * 24;

  ctx.save();
  ctx.lineCap = "round";

  // Expanding ring
  ctx.strokeStyle = `rgba(255,255,255,${0.85 * fade})`;
  ctx.lineWidth = Math.max(0.5, 3.5 * fade);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  // Radiating spikes
  ctx.strokeStyle = `rgba(255,210,62,${fade})`;
  ctx.lineWidth = Math.max(0.5, 3 * fade);
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55);
    ctx.lineTo(x + Math.cos(a) * r * 1.15, y + Math.sin(a) * r * 1.15);
    ctx.stroke();
  }

  ctx.restore();
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
