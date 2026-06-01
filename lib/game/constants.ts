import { optionToSwatchColor } from "@/lib/product-swatches";
import type { BearId, GlowBear } from "@/lib/game/types";

export const GLOW_BEARS: readonly GlowBear[] = [
  { id: "matcha", name: "Matcha", hex: optionToSwatchColor("matcha green") },
  { id: "sakura", name: "Sakura", hex: optionToSwatchColor("sakura pink") },
  { id: "honey", name: "Honey", hex: optionToSwatchColor("honey brown") },
  { id: "cloud", name: "Cloud", hex: optionToSwatchColor("cloud cream") },
] as const;

export const BEAR_BY_ID: Record<BearId, GlowBear> = Object.fromEntries(
  GLOW_BEARS.map((b) => [b.id, b]),
) as Record<BearId, GlowBear>;

export const GAME_CONFIG = {
  strawberryCount: 40,
  bombCount: 6,
  treeShakeAtProgress: 0.8,
  treeShakeBurstCount: 12,
  strawberryPoints: 1,
  bombPenalty: 3,
  baseSpeed: 180,
  minSpeedFactor: 0.55,
  slowdownPerPoint: 0.02,
  bearWidth: 56,
  bearHeight: 64,
  basketWidth: 44,
  basketHeight: 28,
  dropSize: 26,
  dropSpeed: 120,
  bumpCooldownMs: 400,
  bumpPushForce: 140,
  adjacencyGap: 8,
  groundPadding: 16,
  treeHeightRatio: 0.32,
  hudHeight: 38,
  spawnIntervalMs: 900,
} as const;

export function bearSpeedForScore(baseSpeed: number, score: number): number {
  const factor = Math.max(
    GAME_CONFIG.minSpeedFactor,
    1 - score * GAME_CONFIG.slowdownPerPoint,
  );
  return baseSpeed * factor;
}

export function otherBearIds(playerId: BearId): BearId[] {
  return GLOW_BEARS.filter((b) => b.id !== playerId).map((b) => b.id);
}
