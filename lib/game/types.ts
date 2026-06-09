export type BearId = "matcha" | "sakura" | "honey" | "cloud";

export type GamePhase = "select" | "playing" | "results";

export type DropType = "strawberry" | "bomb";

export type GlowBear = {
  id: BearId;
  name: string;
  hex: string;
};

export type BearState = {
  id: BearId;
  x: number;
  y: number;
  score: number;
  isPlayer: boolean;
  vx: number;
  /** Knockback velocity from bumps — decays over time, independent of input */
  knockVx: number;
  moveDir: -1 | 0 | 1;
  bumpCooldown: number;
  bumpAnim: number;
};

export type DropEntity = {
  id: number;
  x: number;
  y: number;
  vy: number;
  type: DropType;
  active: boolean;
};

export type RoundResult = {
  winnerId: BearId;
  scores: Record<BearId, number>;
  playerBearId: BearId;
};

export type GameSnapshot = {
  bears: BearState[];
  drops: DropEntity[];
  treeShake: number;
  roundComplete: boolean;
  spawnProgress: number;
};

export type InputState = {
  left: boolean;
  right: boolean;
  bump: boolean;
};
