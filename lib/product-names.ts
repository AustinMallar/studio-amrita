/** Canonical product line names for storefront copy — always Title Case. */
export const PRODUCT_NAMES = {
  glowBear: "Glow Bear",
  glowBears: "Glow Bears",
  essentialGlowBear: "Essential Glow Bear",
  classicGlowBear: "Classic Glow Bear",
  babyGlowBear: "Baby Glow Bear",
} as const;

/** Comma-separated list for shipping / FAQ copy. */
export const GLOW_BEAR_LINE_NAMES = `${PRODUCT_NAMES.essentialGlowBear}, ${PRODUCT_NAMES.classicGlowBear}, and ${PRODUCT_NAMES.babyGlowBear}`;
