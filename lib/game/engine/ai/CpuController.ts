import { BEAR_BY_ID, GAME_CONFIG, bearSpeedForScore } from "@/lib/game/constants";
import type { BearId, BearState, DropEntity, InputState } from "@/lib/game/types";

type CpuDecision = {
  moveDir: -1 | 0 | 1;
  bump: boolean;
};

function nearestDrop(
  bear: BearState,
  drops: DropEntity[],
  preferStrawberry: boolean,
): DropEntity | null {
  let best: DropEntity | null = null;
  let bestDist = Infinity;

  for (const drop of drops) {
    if (!drop.active) continue;
    if (preferStrawberry && drop.type === "bomb") continue;
    const dist = Math.abs(drop.x - bear.x) + Math.max(0, drop.y - bear.y) * 0.3;
    if (dist < bestDist) {
      bestDist = dist;
      best = drop;
    }
  }

  return best;
}

function adjacentBear(bear: BearState, others: BearState[]): BearState | null {
  for (const other of others) {
    if (other.id === bear.id) continue;
    const gap = Math.abs(other.x - bear.x);
    if (gap <= GAME_CONFIG.bearWidth + GAME_CONFIG.adjacencyGap) {
      return other;
    }
  }
  return null;
}

export function updateCpuInput(
  bear: BearState,
  bears: BearState[],
  drops: DropEntity[],
  playerBear: BearState,
  rng: () => number,
): InputState {
  const target = nearestDrop(bear, drops, true) ?? nearestDrop(bear, drops, false);
  let moveDir: -1 | 0 | 1 = 0;

  if (target) {
    const dx = target.x - bear.x;
    if (Math.abs(dx) > 6) {
      moveDir = dx > 0 ? 1 : -1;
    }
    if (target.type === "bomb" && Math.abs(dx) < 20 && target.y > bear.y - 80) {
      moveDir = dx > 0 ? -1 : 1;
    }
  }

  if (rng() < 0.08) {
    moveDir = 0;
  } else if (rng() < 0.05 && !target) {
    moveDir = rng() > 0.5 ? 1 : -1;
  }

  const others = bears.filter((b) => b.id !== bear.id);
  const neighbor = adjacentBear(bear, others);
  let bump = false;

  if (neighbor && bear.bumpCooldown <= 0) {
    const blockingPlayer =
      neighbor.id === playerBear.id &&
      target &&
      target.type === "strawberry" &&
      Math.abs(target.x - bear.x) < 30;

    if (blockingPlayer && rng() < 0.35) {
      bump = true;
    } else if (neighbor.id !== playerBear.id && rng() < 0.08) {
      bump = true;
    }
  }

  return {
    left: moveDir === -1,
    right: moveDir === 1,
    bump,
  };
}

export function applyMovementInput(
  bear: BearState,
  input: InputState,
  dt: number,
  arenaWidth: number,
): void {
  let moveDir: -1 | 0 | 1 = 0;
  if (input.left && !input.right) moveDir = -1;
  else if (input.right && !input.left) moveDir = 1;

  bear.moveDir = moveDir;
  const speed = bearSpeedForScore(GAME_CONFIG.baseSpeed, bear.score);
  bear.vx = moveDir * speed;

  const halfW = GAME_CONFIG.bearWidth / 2;
  const minX = GAME_CONFIG.groundPadding + halfW;
  const maxX = arenaWidth - GAME_CONFIG.groundPadding - halfW;
  bear.x = Math.max(minX, Math.min(maxX, bear.x + bear.vx * dt));
}

export function getBearLabel(bearId: BearId): string {
  return BEAR_BY_ID[bearId].name;
}
