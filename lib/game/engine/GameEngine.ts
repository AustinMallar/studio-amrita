import {
  BEAR_BY_ID,
  GAME_CONFIG,
  GLOW_BEARS,
} from "@/lib/game/constants";
import { applyMovementInput, updateCpuInput } from "@/lib/game/engine/ai/CpuController";
import {
  drawArcadeFrame,
  drawKirbyBasket,
  drawKirbyBomb,
  drawKirbyBushes,
  drawKirbyForest,
  drawKirbyGround,
  drawKirbyScoreHud,
  drawKirbySky,
  drawKirbyStrawberry,
  KIRBY,
} from "@/lib/game/render/kirbyStyle";
import type { SpriteSheet } from "@/lib/game/sprites";
import type {
  BearId,
  BearState,
  DropEntity,
  DropType,
  GameSnapshot,
  InputState,
  RoundResult,
} from "@/lib/game/types";

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class GameEngine {
  private width = 800;
  private height = 480;
  private bears: BearState[] = [];
  private drops: DropEntity[] = [];
  private playerBearId: BearId = "matcha";
  private input: InputState = { left: false, right: false, bump: false };
  private bumpRequested = false;
  private dropIdCounter = 0;
  private strawberriesSpawned = 0;
  private bombsSpawned = 0;
  private spawnTimer = 0;
  private treeShake = 0;
  private treeShakeTriggered = false;
  private roundComplete = false;
  private pendingBurst = 0;
  private rng: () => number = Math.random;
  private sprites: SpriteSheet | null = null;
  private reducedMotion = false;
  private paused = false;
  private lastTime = 0;
  /** Fixed background tree positions — independent of character movement */
  private laneX: number[] = [];

  constructor(playerBearId: BearId) {
    this.playerBearId = playerBearId;
    this.rng = mulberry32(Date.now() % 100000);
    this.resetRound();
  }

  setSprites(sprites: SpriteSheet): void {
    this.sprites = sprites;
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.layoutBears();
  }

  setInput(input: InputState): void {
    this.input = input;
    if (input.bump) this.bumpRequested = true;
  }

  getSnapshot(): GameSnapshot {
    const totalSpawns = GAME_CONFIG.strawberryCount + GAME_CONFIG.bombCount;
    const spawned = this.strawberriesSpawned + this.bombsSpawned;
    return {
      bears: this.bears.map((b) => ({ ...b })),
      drops: this.drops.filter((d) => d.active),
      treeShake: this.treeShake,
      roundComplete: this.roundComplete,
      spawnProgress: spawned / totalSpawns,
    };
  }

  getRoundResult(): RoundResult | null {
    if (!this.roundComplete) return null;
    const scores = Object.fromEntries(this.bears.map((b) => [b.id, b.score])) as Record<
      BearId,
      number
    >;
    const winner = [...this.bears].sort((a, b) => b.score - a.score)[0];
    return {
      winnerId: winner.id,
      scores,
      playerBearId: this.playerBearId,
    };
  }

  private resetRound(): void {
    const ids: BearId[] = [this.playerBearId, ...GLOW_BEARS.filter((b) => b.id !== this.playerBearId).map((b) => b.id)];
    this.bears = ids.map((id, i) => ({
      id,
      x: 0,
      y: 0,
      score: 0,
      isPlayer: id === this.playerBearId,
      vx: 0,
      moveDir: 0,
      bumpCooldown: 0,
      bumpAnim: 0,
    }));
    this.drops = [];
    this.strawberriesSpawned = 0;
    this.bombsSpawned = 0;
    this.spawnTimer = 0;
    this.treeShake = 0;
    this.treeShakeTriggered = false;
    this.roundComplete = false;
    this.pendingBurst = 0;
    this.layoutBears();
  }

  private layoutBears(): void {
    const groundY = this.groundY();
    this.laneX = this.computeLanePositions();
    this.bears.forEach((bear, i) => {
      bear.x = this.laneX[i] ?? bear.x;
      bear.y = groundY;
    });
  }

  private computeLanePositions(): number[] {
    const slots = Math.max(this.bears.length, 4);
    const usable = this.width - GAME_CONFIG.groundPadding * 2;
    const spacing = usable / (slots + 1);
    return Array.from({ length: slots }, (_, i) => GAME_CONFIG.groundPadding + spacing * (i + 1));
  }

  private groundY(): number {
    const playH = this.playHeight();
    return playH * 0.65;
  }

  private laneWidth(): number {
    const slots = Math.max(this.bears.length, 4);
    const usable = this.width - GAME_CONFIG.groundPadding * 2;
    return usable / (slots + 1);
  }

  private canopyTop(): number {
    return 4;
  }

  private playHeight(): number {
    return this.height - GAME_CONFIG.hudHeight;
  }

  private treeY(): number {
    return this.groundY();
  }

  private spawnProgress(): number {
    const total = GAME_CONFIG.strawberryCount + GAME_CONFIG.bombCount;
    return (this.strawberriesSpawned + this.bombsSpawned) / total;
  }

  private spawnDrop(type: DropType, x?: number): void {
    const margin = GAME_CONFIG.groundPadding + 20;
    const spawnX = x ?? margin + this.rng() * (this.width - margin * 2);
    const top = this.canopyTop();
    const ground = this.groundY();
    const playH = ground - top;
    const trunkTop = ground - playH * 0.22;
    const canopyTop = top + 2;
    this.drops.push({
      id: ++this.dropIdCounter,
      x: spawnX,
      y: canopyTop + 12 + this.rng() * (trunkTop - canopyTop - 20),
      vy: GAME_CONFIG.dropSpeed * (0.85 + this.rng() * 0.3),
      type,
      active: true,
    });
    if (type === "strawberry") this.strawberriesSpawned++;
    else this.bombsSpawned++;
  }

  private trySpawn(dt: number): void {
    if (this.roundComplete) return;

    const progress = this.spawnProgress();
    if (!this.treeShakeTriggered && progress >= GAME_CONFIG.treeShakeAtProgress) {
      this.treeShakeTriggered = true;
      this.pendingBurst = this.reducedMotion ? 4 : GAME_CONFIG.treeShakeBurstCount;
      this.treeShake = 1;
    }

    if (this.pendingBurst > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const type: DropType = this.rng() < 0.15 ? "bomb" : "strawberry";
        if (type === "strawberry" && this.strawberriesSpawned < GAME_CONFIG.strawberryCount) {
          this.spawnDrop("strawberry");
        } else if (type === "bomb" && this.bombsSpawned < GAME_CONFIG.bombCount) {
          this.spawnDrop("bomb");
        } else {
          this.spawnDrop(this.rng() < 0.5 ? "strawberry" : "bomb");
        }
        this.pendingBurst--;
        this.spawnTimer = 0.08;
      }
      return;
    }

    const strawberriesLeft = GAME_CONFIG.strawberryCount - this.strawberriesSpawned;
    const bombsLeft = GAME_CONFIG.bombCount - this.bombsSpawned;
    if (strawberriesLeft <= 0 && bombsLeft <= 0) return;

    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;

    const bombChance = bombsLeft / Math.max(1, strawberriesLeft + bombsLeft);
    let type: DropType = "strawberry";
    if (bombsLeft > 0 && strawberriesLeft > 0 && this.rng() < bombChance) {
      type = "bomb";
    } else if (strawberriesLeft <= 0) {
      type = "bomb";
    }

    this.spawnDrop(type);
    this.spawnTimer = GAME_CONFIG.spawnIntervalMs / 1000;
  }

  private checkRoundEnd(): void {
    const allSpawned =
      this.strawberriesSpawned >= GAME_CONFIG.strawberryCount &&
      this.bombsSpawned >= GAME_CONFIG.bombCount;
    const activeDrops = this.drops.some((d) => d.active);
    if (allSpawned && !activeDrops && this.pendingBurst <= 0) {
      this.roundComplete = true;
    }
  }

  private basketRect(bear: BearState): { x: number; y: number; w: number; h: number } {
    const w = GAME_CONFIG.basketWidth;
    const h = GAME_CONFIG.basketHeight;
    return {
      x: bear.x - w / 2,
      y: bear.y - GAME_CONFIG.bearHeight + 8,
      w,
      h,
    };
  }

  private updateDrops(dt: number): void {
    const ground = this.groundY() + 10;
    for (const drop of this.drops) {
      if (!drop.active) continue;
      drop.y += drop.vy * dt;
      if (drop.y > ground + 40) {
        drop.active = false;
      }
    }
  }

  private resolveCollisions(): void {
    for (const drop of this.drops) {
      if (!drop.active) continue;
      for (const bear of this.bears) {
        const basket = this.basketRect(bear);
        const dx = Math.abs(drop.x - (basket.x + basket.w / 2));
        const dy = drop.y - (basket.y + basket.h / 2);
        if (dx < basket.w * 0.55 && dy > -8 && dy < basket.h * 0.8) {
          drop.active = false;
          if (drop.type === "strawberry") {
            bear.score += GAME_CONFIG.strawberryPoints;
          } else {
            bear.score = Math.max(0, bear.score - GAME_CONFIG.bombPenalty);
          }
          bear.bumpAnim = 0.15;
          break;
        }
      }
    }
  }

  private sortedBearsByX(): BearState[] {
    return [...this.bears].sort((a, b) => a.x - b.x);
  }

  private resolveBump(): void {
    if (!this.bumpRequested) return;
    this.bumpRequested = false;

    const player = this.bears.find((b) => b.isPlayer);
    if (!player || player.bumpCooldown > 0) return;

    const sorted = this.sortedBearsByX();
    const idx = sorted.findIndex((b) => b.id === player.id);
    if (idx < 0) return;

    let neighbor: BearState | null = null;
    if (idx > 0) {
      const left = sorted[idx - 1];
      if (Math.abs(left.x - player.x) <= GAME_CONFIG.bearWidth + GAME_CONFIG.adjacencyGap) {
        neighbor = left;
      }
    }
    if (!neighbor && idx < sorted.length - 1) {
      const right = sorted[idx + 1];
      if (Math.abs(right.x - player.x) <= GAME_CONFIG.bearWidth + GAME_CONFIG.adjacencyGap) {
        neighbor = right;
      }
    }
    if (!neighbor || neighbor.bumpCooldown > 0) return;

    const moving = player.moveDir !== 0;
    if (moving) {
      const tempX = player.x;
      player.x = neighbor.x;
      neighbor.x = tempX;
    } else {
      const dir = neighbor.x > player.x ? 1 : -1;
      const push = GAME_CONFIG.bumpPushForce * 0.05;
      neighbor.x += dir * push * 8;
      const halfW = GAME_CONFIG.bearWidth / 2;
      const minX = GAME_CONFIG.groundPadding + halfW;
      const maxX = this.width - GAME_CONFIG.groundPadding - halfW;
      neighbor.x = Math.max(minX, Math.min(maxX, neighbor.x));
    }

    player.bumpCooldown = GAME_CONFIG.bumpCooldownMs / 1000;
    neighbor.bumpCooldown = GAME_CONFIG.bumpCooldownMs / 1000;
    player.bumpAnim = 0.2;
    neighbor.bumpAnim = 0.2;
  }

  private resolveCpuBumps(): void {
    const player = this.bears.find((b) => b.isPlayer)!;
    for (const bear of this.bears) {
      if (bear.isPlayer || bear.bumpCooldown > 0) continue;
      const input = updateCpuInput(bear, this.bears, this.drops, player, this.rng);
      if (!input.bump) continue;

      const sorted = this.sortedBearsByX();
      const idx = sorted.findIndex((b) => b.id === bear.id);
      let neighbor: BearState | null = null;
      if (idx > 0) {
        const left = sorted[idx - 1];
        if (Math.abs(left.x - bear.x) <= GAME_CONFIG.bearWidth + GAME_CONFIG.adjacencyGap) {
          neighbor = left;
        }
      }
      if (!neighbor && idx < sorted.length - 1) {
        const right = sorted[idx + 1];
        if (Math.abs(right.x - bear.x) <= GAME_CONFIG.bearWidth + GAME_CONFIG.adjacencyGap) {
          neighbor = right;
        }
      }
      if (!neighbor || neighbor.bumpCooldown > 0) continue;

      const moving = bear.moveDir !== 0;
      if (moving) {
        const tempX = bear.x;
        bear.x = neighbor.x;
        neighbor.x = tempX;
      } else {
        const dir = neighbor.x > bear.x ? 1 : -1;
        neighbor.x += dir * GAME_CONFIG.bumpPushForce * 0.4;
      }
      bear.bumpCooldown = GAME_CONFIG.bumpCooldownMs / 1000;
      neighbor.bumpCooldown = GAME_CONFIG.bumpCooldownMs / 1000;
    }
  }

  update(dt: number): void {
    if (this.paused || this.roundComplete) {
      if (this.treeShake > 0) this.treeShake = Math.max(0, this.treeShake - dt * 2);
      this.checkRoundEnd();
      return;
    }

    const player = this.bears.find((b) => b.isPlayer)!;
    applyMovementInput(player, this.input, dt, this.width);

    for (const bear of this.bears) {
      if (bear.isPlayer) continue;
      const cpuInput = updateCpuInput(bear, this.bears, this.drops, player, this.rng);
      applyMovementInput(bear, cpuInput, dt, this.width);
    }

    this.resolveBump();
    this.resolveCpuBumps();

    for (const bear of this.bears) {
      bear.bumpCooldown = Math.max(0, bear.bumpCooldown - dt);
      bear.bumpAnim = Math.max(0, bear.bumpAnim - dt);
    }

    this.trySpawn(dt);
    this.updateDrops(dt);
    this.resolveCollisions();
    this.checkRoundEnd();

    if (this.treeShake > 0) {
      this.treeShake = Math.max(0, this.treeShake - dt * 0.8);
    }
  }

  tick(now: number): void {
    if (this.lastTime === 0) {
      this.lastTime = now;
      return;
    }
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;
    const playH = this.playHeight();
    const groundY = this.groundY();
    ctx.clearRect(0, 0, w, h);

    drawKirbySky(ctx, w, playH);
    drawKirbyBushes(ctx, w, groundY);

    const shakeX = this.reducedMotion ? 0 : Math.sin(Date.now() * 0.02) * this.treeShake * 8;
    const playTop = this.canopyTop();
    const laneW = this.laneWidth();
    drawKirbyForest(ctx, w, groundY, playTop, this.laneX, laneW, shakeX);

    drawKirbyGround(ctx, w, playH, groundY);

    for (const drop of this.drops) {
      if (!drop.active) continue;
      this.drawDrop(ctx, drop);
    }

    for (const bear of this.sortedBearsByX()) {
      this.drawBear(ctx, bear);
    }

    drawKirbyScoreHud(
      ctx,
      w,
      h,
      GAME_CONFIG.hudHeight,
      this.bears.map((b) => ({ id: b.id, x: b.x, score: b.score, isPlayer: b.isPlayer })),
    );

    drawArcadeFrame(ctx, w, h);

    if (this.roundComplete) {
      ctx.fillStyle = "rgba(40, 32, 24, 0.25)";
      ctx.fillRect(0, 0, w, playH);
    }
  }

  private drawDrop(ctx: CanvasRenderingContext2D, drop: DropEntity): void {
    const size = GAME_CONFIG.dropSize;
    if (drop.type === "strawberry") {
      const img = this.sprites?.strawberry;
      if (img) {
        ctx.drawImage(img, drop.x - size * 0.5, drop.y - size * 0.55, size, size * 1.2);
      } else {
        drawKirbyStrawberry(ctx, drop.x, drop.y, size);
      }
    } else {
      const img = this.sprites?.bomb;
      if (img) {
        ctx.drawImage(img, drop.x - size * 0.5, drop.y - size * 0.75, size, size * 1.3);
      } else {
        drawKirbyBomb(ctx, drop.x, drop.y, size, Date.now());
      }
    }
  }

  private drawBear(ctx: CanvasRenderingContext2D, bear: BearState): void {
    const bearInfo = BEAR_BY_ID[bear.id];
    const w = GAME_CONFIG.bearWidth;
    const h = GAME_CONFIG.bearHeight;
    const bob = this.reducedMotion ? 0 : Math.sin(Date.now() * 0.012 + bear.x) * 2;
    const scale = 1 + bear.bumpAnim * 0.12;
    const x = bear.x;
    const y = bear.y + bob;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, 2 - scale);

    const bearImg = this.sprites?.bears[bear.id];
    if (bearImg) {
      ctx.drawImage(bearImg, -w / 2, -h + 10, w, h);
    } else {
      ctx.fillStyle = KIRBY.outline;
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.45, w * 0.4, h * 0.44, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bearInfo.hex;
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.45, w * 0.36, h * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(-9, -h * 0.52, 4, 0, Math.PI * 2);
      ctx.arc(9, -h * 0.52, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#281808";
      ctx.beginPath();
      ctx.arc(-9, -h * 0.52, 2, 0, Math.PI * 2);
      ctx.arc(9, -h * 0.52, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const bw = GAME_CONFIG.basketWidth;
    const bh = GAME_CONFIG.basketHeight;
    const basketImg = this.sprites?.basket;
    if (basketImg) {
      ctx.drawImage(basketImg, -bw / 2, -bh - 2, bw, bh);
    } else {
      drawKirbyBasket(ctx, 0, -6, bw, bh, bear.score);
    }

    ctx.restore();

    if (bear.isPlayer) {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#281808";
      ctx.lineWidth = 2;
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.strokeText("▼", x, y - h - 6);
      ctx.fillText("▼", x, y - h - 6);
    }
  }
}
