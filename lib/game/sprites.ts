import type { BearId, DropType } from "@/lib/game/types";

export type SpriteSheet = {
  bears: Partial<Record<BearId, HTMLImageElement>>;
  basket: HTMLImageElement | null;
  strawberry: HTMLImageElement | null;
  bomb: HTMLImageElement | null;
  tree: HTMLImageElement | null;
  loaded: boolean;
};

const SPRITE_PATHS = {
  bears: {
    matcha: "/game/sprites/bear-matcha.svg",
    sakura: "/game/sprites/bear-sakura.svg",
    honey: "/game/sprites/bear-honey.svg",
    cloud: "/game/sprites/bear-cloud.svg",
  },
  basket: "/game/sprites/basket.svg",
  strawberry: "/game/sprites/strawberry.svg",
  bomb: "/game/sprites/bomb.svg",
  tree: "/game/sprites/tree.svg",
} as const;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load sprite: ${src}`));
    img.src = src;
  });
}

export async function loadSprites(): Promise<SpriteSheet> {
  const sheet: SpriteSheet = {
    bears: {},
    basket: null,
    strawberry: null,
    bomb: null,
    tree: null,
    loaded: false,
  };

  const bearIds = Object.keys(SPRITE_PATHS.bears) as BearId[];
  const bearResults = await Promise.allSettled(
    bearIds.map(async (id) => {
      const img = await loadImage(SPRITE_PATHS.bears[id]);
      return { id, img };
    }),
  );

  for (const result of bearResults) {
    if (result.status === "fulfilled") {
      sheet.bears[result.value.id] = result.value.img;
    }
  }

  const [basket, strawberry, bomb, tree] = await Promise.allSettled([
    loadImage(SPRITE_PATHS.basket),
    loadImage(SPRITE_PATHS.strawberry),
    loadImage(SPRITE_PATHS.bomb),
    loadImage(SPRITE_PATHS.tree),
  ]);

  if (basket.status === "fulfilled") sheet.basket = basket.value;
  if (strawberry.status === "fulfilled") sheet.strawberry = strawberry.value;
  if (bomb.status === "fulfilled") sheet.bomb = bomb.value;
  if (tree.status === "fulfilled") sheet.tree = tree.value;

  sheet.loaded = true;
  return sheet;
}

export function drawDropFallback(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  type: DropType,
): void {
  if (type === "strawberry") {
    ctx.fillStyle = "#d4647a";
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.1, size * 0.4, size * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7a9e6a";
    ctx.beginPath();
    ctx.moveTo(x - size * 0.15, y - size * 0.35);
    ctx.lineTo(x, y - size * 0.55);
    ctx.lineTo(x + size * 0.2, y - size * 0.3);
    ctx.fill();
  } else {
    ctx.fillStyle = "#4a3f4a";
    ctx.beginPath();
    ctx.arc(x, y, size * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#e4a8a8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.38);
    ctx.quadraticCurveTo(x + 6, y - size * 0.7, x + 4, y - size * 0.85);
    ctx.stroke();
  }
}
